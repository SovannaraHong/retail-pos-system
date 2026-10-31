<?php

namespace App\Services;

use App\Models\Products;
use App\Models\Sales;
use App\Models\Shifts;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;


class CheckoutService
{
    public function __construct(private StockService $stock) {}

    // price + save in one transaction (cash, card, bank, qr taken at the counter)
    public function checkout(User $user, array $data, bool $allowNegativeStock = false): Sales
    {
        return DB::transaction(function () use ($user, $data, $allowNegativeStock) {
            $priced = $this->price($user, $data, true);

            return $this->finalize($user, $priced, $data['payments'], $allowNegativeStock);
        });
    }


    public function price(User $user, array $data, bool $lock = false): array
    {
        $itemsIn = collect($data['items']);

        $wantsDiscount = (float) ($data['discount'] ?? 0) > 0
            || $itemsIn->contains(fn($i) => (float) ($i['discount'] ?? 0) > 0);

        if ($wantsDiscount && ! $user->can('sales.discount')) {
            abort(403, 'You are not allowed to give discounts.');
        }

        $ids = $itemsIn->pluck('product_id')->map(fn($v) => (int) $v)->sort()->values();

        $query = Products::query()
            ->whereIn('id', $ids)
            ->where('is_active', true)
            ->orderBy('id');

        if ($lock) {
            $query->lockForUpdate();
        }

        $products = $query->get()->keyBy('id');

        foreach ($ids as $id) {
            if (! $products->has($id)) {
                throw ValidationException::withMessages([
                    'items' => ["Product #{$id} is not available for sale."],
                ]);
            }
        }

        $lines = $itemsIn->map(function ($item) use ($products) {
            $product = $products[(int) $item['product_id']];

            $qty   = round((float) $item['qty'], 3);
            $price = round((float) $product->sell_price, 2);
            $gross = round($qty * $price, 2);
            $disc  = round((float) ($item['discount'] ?? 0), 2);

            if ($disc > $gross) {
                throw ValidationException::withMessages([
                    'items' => ["Discount for {$product->name} is bigger than the line amount."],
                ]);
            }

            $taxable = round($gross - $disc, 2);
            $tax     = round($taxable * (float) $product->tax_rate / 100, 2);

            return [
                'product_id'   => $product->id,
                'product_name' => $product->name,   // snapshot: later edits never change old receipts
                'sku'          => $product->sku,
                'qty'          => $qty,
                'unit_price'   => $price,
                'cost_price'   => round((float) $product->cost_price, 2),
                'discount'     => $disc,
                'tax'          => $tax,
                'line_total'   => round($taxable + $tax, 2),
            ];
        })->values();

        $subtotal      = round($lines->sum(fn($l) => round($l['qty'] * $l['unit_price'], 2)), 2);
        $lineDiscount  = round($lines->sum('discount'), 2);
        $tax           = round($lines->sum('tax'), 2);
        $orderDiscount = round((float) ($data['discount'] ?? 0), 2);
        $total         = round($subtotal - $lineDiscount + $tax - $orderDiscount, 2);

        if ($total <= 0) {
            throw ValidationException::withMessages([
                'discount' => ['The total must be greater than zero.'],
            ]);
        }

        return [
            'customer_id' => $data['customer_id'] ?? null,
            'note'        => $data['note'] ?? null,
            'lines'       => $lines->all(),
            'subtotal'    => $subtotal,
            'discount'    => round($lineDiscount + $orderDiscount, 2),
            'tax'         => $tax,
            'total'       => $total,
        ];
    }


    public function finalize(User $user, array $priced, array $paymentsIn, bool $allowNegativeStock = false): Sales
    {
        return DB::transaction(function () use ($user, $priced, $paymentsIn, $allowNegativeStock) {

            // a cashier must have an open shift: cash is counted per shift
            $shift = Shifts::where('user_id', $user->id)
                ->where('status', 'open')
                ->lockForUpdate()
                ->first();

            if (! $shift) {
                abort(409, 'Open a shift before selling.');
            }

            $lines = collect($priced['lines']);
            $total = round((float) $priced['total'], 2);

            // payments: what the customer handed over, change comes back from cash
            $payments = collect($paymentsIn)->map(fn($p) => [
                'method'    => $p['method'],
                'amount'    => round((float) $p['amount'], 2),
                'reference' => $p['reference'] ?? null,
            ])->values();

            $tendered = round($payments->sum('amount'), 2);

            if ($tendered < $total) {
                throw ValidationException::withMessages([
                    'payments' => ["Payment ({$tendered}) is less than the total ({$total})."],
                ]);
            }

            $change = round($tendered - $total, 2);

            if ($change > 0) {
                $cashHandedOver = round($payments->where('method', 'cash')->sum('amount'), 2);

                if ($cashHandedOver < $change) {
                    throw ValidationException::withMessages([
                        'payments' => ['Change can only be given back from cash.'],
                    ]);
                }

                // store what the shop really kept, so the payments add up to the total
                $remaining = $change;
                $payments = $payments->map(function ($p) use (&$remaining) {
                    if ($p['method'] === 'cash' && $remaining > 0) {
                        $take = min($remaining, $p['amount']);
                        $p['amount'] = round($p['amount'] - $take, 2);
                        $remaining   = round($remaining - $take, 2);
                    }

                    return $p;
                })->filter(fn($p) => $p['amount'] > 0)->values();
            }

            $sale = Sales::create([
                'invoice_no'    => 'TMP-' . Str::uuid(),
                'user_id'       => $user->id,
                'customer_id'   => $priced['customer_id'] ?? null,
                'shift_id'      => $shift->id,
                'subtotal'      => $priced['subtotal'],
                'discount'      => $priced['discount'],
                'tax'           => $priced['tax'],
                'total'         => $total,
                'paid_amount'   => $tendered,
                'change_amount' => $change,
                'status'        => 'completed',
                'note'          => $priced['note'] ?? null,
                'sold_at'       => now(),
            ]);

            // invoice number from the id: unique, never repeats, no race condition
            $sale->update([
                'invoice_no' => 'INV-' . now()->format('Ymd') . '-' . str_pad((string) $sale->id, 6, '0', STR_PAD_LEFT),
            ]);

            $sale->items()->createMany($lines->all());
            $sale->payments()->createMany($payments->all());

            // take the stock out (422 and full rollback if not enough, unless negative stock is allowed)
            foreach ($lines->sortBy('product_id') as $line) {
                $this->stock->move(
                    (int) $line['product_id'],
                    'sale',
                    -1 * (float) $line['qty'],
                    $user->id,
                    $sale,
                    "Sale {$sale->invoice_no}",
                    $allowNegativeStock,
                );
            }

            return $sale;
        });
    }
}
