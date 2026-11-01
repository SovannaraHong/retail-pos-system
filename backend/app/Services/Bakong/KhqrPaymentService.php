<?php

namespace App\Services\Bakong;

use App\Models\KhqrPayment;
use App\Models\Shifts;
use App\Models\User;
use App\Services\CheckoutService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

//3
//KhqrPaymentService – Manages the complete KHQR payment process: creates pending payments, checks payment status,
//handles cancellation and expiration, verifies successful payments, and creates the sale after payment is confirmed.
class KhqrPaymentService
{
    public function __construct(
        private CheckoutService $checkout,
        private KhqrGenerator $generator,
        private BakongClient $bakong,
    ) {}


    public function create(User $user, array $data): KhqrPayment
    {
        if (! config('bakong.account_id') || ! config('bakong.merchant_name')) {
            abort(500, 'Bakong is not configured: set BAKONG_ACCOUNT_ID and BAKONG_MERCHANT_NAME in .env, then run php artisan config:clear.');
        }

        // fail early, before the customer scans anything
        if (! Shifts::where('user_id', $user->id)->where('status', 'open')->exists()) {
            abort(409, 'Open a shift before selling.');
        }

        $priced   = $this->checkout->price($user, $data);
        $total    = (float) $priced['total'];
        $currency = strtoupper((string) config('bakong.currency', 'USD'));

        if ($currency === 'KHR' && abs($total - round($total)) > 0.00001) {
            throw ValidationException::withMessages([
                'items' => ['A KHR total must be a whole number of riel.'],
            ]);
        }

        $reference = $this->newReference();
        $createdMs = (int) floor(microtime(true) * 1000);
        $expiresMs = $createdMs + ((int) config('bakong.expire_minutes', 5)) * 60 * 1000;

        $khqr = $this->generator->generate([
            'account_type'   => config('bakong.account_type', 'individual'),
            'account_id'     => config('bakong.account_id'),
            'merchant_name'  => config('bakong.merchant_name'),
            'merchant_city'  => config('bakong.merchant_city', 'Siem Reap'),
            'merchant_id'    => config('bakong.merchant_id'),
            'acquiring_bank' => config('bakong.acquiring_bank'),
            'currency'       => $currency,
            'amount'         => $total,
            'bill_number'    => $reference,
            'created_at_ms'  => $createdMs,
            'expires_at_ms'  => $expiresMs,
        ]);

        return KhqrPayment::create([
            'reference'  => $reference,
            'user_id'    => $user->id,
            'status'     => 'pending',
            'amount'     => $total,
            'currency'   => $currency,
            'qr'         => $khqr['qr'],
            'md5'        => $khqr['md5'],
            'cart'       => $priced,
            'expires_at' => now()->setTimestamp((int) floor($expiresMs / 1000)),
        ]);
    }


    public function refresh(KhqrPayment $payment, bool $force = false): KhqrPayment
    {
        if ($payment->status !== 'pending') {
            return $payment;
        }

        // do not hammer Bakong: at most one check every 2 seconds per payment
        if (! $force && $payment->last_checked_at && $payment->last_checked_at->gt(now()->subSeconds(2))) {
            return $payment;
        }

        $result = $this->bakong->checkTransactionByMd5($payment->md5);

        $payment->forceFill(['last_checked_at' => now()])->save();

        if ($result['state'] === 'paid') {
            return $this->settle($payment, $result['data']);
        }

        if ($result['state'] === 'failed') {
            $payment->update(['status' => 'failed', 'error' => $result['message']]);

            return $payment;
        }

        if ($payment->expires_at->isPast()) {
            $payment->update(['status' => 'expired']);
        }

        return $payment;
    }

    // cashier changes their mind. A last check makes sure we never cancel a QR that was just paid.
    public function cancel(KhqrPayment $payment): KhqrPayment
    {
        try {
            $payment = $this->refresh($payment, true);
        } catch (BakongException $e) {
            Log::warning('KHQR cancel: could not check Bakong first', ['payment' => $payment->id, 'error' => $e->getMessage()]);
        }

        if ($payment->status === 'pending') {
            $payment->update(['status' => 'cancelled']);
        }

        return $payment;
    }


    public function reconcile(KhqrPayment $payment): KhqrPayment
    {
        if ($payment->status === 'pending') {
            return $this->refresh($payment, true);
        }

        if (! in_array($payment->status, ['expired', 'cancelled'], true)) {
            return $payment;
        }

        $result = $this->bakong->checkTransactionByMd5($payment->md5);

        if ($result['state'] === 'paid') {
            $payment->update([
                'status'          => 'needs_review',
                'error'           => 'The customer paid after this QR was ' . $payment->status . '. Refund them or create the sale by hand.',
                'bakong_hash'     => $result['data']['hash'] ?? null,
                'from_account'    => $result['data']['fromAccountId'] ?? null,
                'bakong_response' => $result['data'],
                'paid_at'         => now(),
            ]);
        }

        return $payment;
    }

    // money arrived: verify it, then create the sale from the frozen cart
    private function settle(KhqrPayment $payment, array $data): KhqrPayment
    {
        $amountOk   = abs((float) ($data['amount'] ?? 0) - (float) $payment->amount) < 0.005;
        $currencyOk = strtoupper((string) ($data['currency'] ?? '')) === $payment->currency;

        if (! empty($data['toAccountId']) && strcasecmp((string) $data['toAccountId'], (string) config('bakong.account_id')) !== 0) {
            Log::warning('KHQR paid to a different account id than configured', [
                'payment' => $payment->id,
                'to'      => $data['toAccountId'],
            ]);
        }

        return DB::transaction(function () use ($payment, $data, $amountOk, $currencyOk) {
            // lock the row so two polls at the same moment cannot create two sales
            $locked = KhqrPayment::lockForUpdate()->findOrFail($payment->id);

            if ($locked->status === 'paid') {
                return $locked;
            }

            $paidInfo = [
                'bakong_hash'     => $data['hash'] ?? null,
                'from_account'    => $data['fromAccountId'] ?? null,
                'bakong_response' => $data,
                'paid_at'         => now(),
            ];

            if ($locked->status !== 'pending') {
                $locked->update($paidInfo + [
                    'status' => 'needs_review',
                    'error'  => 'Paid after this QR was ' . $locked->status . '.',
                ]);

                return $locked;
            }

            if (! $amountOk || ! $currencyOk) {
                $locked->update($paidInfo + [
                    'status' => 'needs_review',
                    'error'  => 'Bakong reports ' . ($data['amount'] ?? '?') . ' ' . ($data['currency'] ?? '?')
                        . ' but the QR was for ' . $locked->amount . ' ' . $locked->currency . '.',
                ]);

                return $locked;
            }

            try {
                // the customer already paid, so the sale must go through even if the stock count says 0
                $sale = $this->checkout->finalize(
                    User::findOrFail($locked->user_id),
                    $locked->cart,
                    [[
                        'method'    => 'qr',
                        'amount'    => (float) $locked->amount,
                        'reference' => $data['hash'] ?? $locked->md5,
                    ]],
                    true,
                );
            } catch (\Throwable $e) {
                Log::error('KHQR paid but the sale could not be created', ['payment' => $locked->id, 'error' => $e->getMessage()]);

                $message = $e instanceof ValidationException
                    ? collect($e->errors())->flatten()->implode(' ')
                    : $e->getMessage();

                $locked->update($paidInfo + [
                    'status' => 'needs_review',
                    'error'  => 'Payment received but the sale could not be created: ' . Str::limit($message, 200),
                ]);

                return $locked;
            }

            $locked->update($paidInfo + ['status' => 'paid', 'sale_id' => $sale->id, 'error' => null]);

            return $locked;
        });
    }

    private function newReference(): string
    {
        do {
            $reference = 'KQ' . strtoupper(Str::random(8));
        } while (KhqrPayment::where('reference', $reference)->exists());

        return $reference;
    }
}
