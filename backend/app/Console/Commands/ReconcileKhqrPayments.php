<?php

namespace App\Console\Commands;

use App\Models\KhqrPayment;
use App\Services\Bakong\BakongException;
use App\Services\Bakong\KhqrPaymentService;
use Illuminate\Console\Command;

class ReconcileKhqrPayments extends Command
{
    protected $signature = 'khqr:reconcile';

    protected $description = 'Check pending KHQR payments, and QR codes that just expired or were cancelled, against Bakong';

    public function handle(KhqrPaymentService $service): int
    {
        $payments = KhqrPayment::query()
            ->where(function ($q) {
                $q->where('status', 'pending')
                    ->orWhere(fn($q) => $q
                        ->whereIn('status', ['expired', 'cancelled'])
                        ->where('expires_at', '>=', now()->subMinutes(15)));
            })
            ->orderBy('id')
            ->get();

        $changed = 0;

        foreach ($payments as $payment) {
            $before = $payment->status;

            try {
                $after = $service->reconcile($payment)->status;
            } catch (BakongException $e) {
                $this->warn("#{$payment->id}: {$e->getMessage()}");
                continue;
            }

            if ($after !== $before) {
                $changed++;
                $this->line("#{$payment->id} {$payment->reference}: {$before} -> {$after}");
            }
        }

        $this->info("Checked {$payments->count()} payment(s), {$changed} changed.");

        return self::SUCCESS;
    }
}
