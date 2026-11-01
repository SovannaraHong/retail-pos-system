<?php

namespace App\Services;

use App\Models\SaleReturnItems;
use App\Models\SaleReturns;
use App\Models\Sales;
use App\Models\Shifts;
use App\Models\User;
use App\Services\StockService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

class ReturnService
{

    public function __construct(private StockService $stock) {}


    //saleTotal is the total price of the sale,
    // sumLineTotals is the total price discount of all products in the sale
    public static function ratio(float $saleTotal, float $sumLineTotals): float
    {
        if ($sumLineTotals <= 0) {
            return 1.0;
        }
        return min(1.0, $saleTotal / $sumLineTotals);
    }

    public static function refundAmountToCustomer(
        float $lineTotal, // total price of one product
        float $ratio, // percentage  of original price customer actually paid
        float $qtySold, //how many customer bought
        float $qtyReturnedBefore, //how many customer already returned product to store
        float $refundedBefore, //money the customer already got back for product
        float $qty //how many item customer return to store now
    ): float {
        $allocate = round($lineTotal * $ratio, 2);

        if (abs($qtyReturnedBefore + $qty - $qtySold) < 0.0005) {
            return round($allocate - $refundedBefore, 2);
        }
        return round($allocate * $qty / $qtySold, 2);
    }


    public function returnable(Sales $sale): array
    {
        $sale->loadMissing('items');

        $returned = $this->returnedPerItem($sale);
        $ratio = self::ratio(
            (float)$sale->total,
            (float)$sale->items->sum(fn($i) => (float)$i->line_total)
        );


        return $sale->items->map(function ($item) use ($returned, $ratio) {
            $qtyReturned = (float) ($returned[$item->id]->qty ?? 0);
            $remaining   = round((float) $item->qty - $qtyReturned, 3);
            $allocated   = round((float) $item->line_total * $ratio, 2);

            return [
                'sale_item_id'  => $item->id,
                'product_id'    => $item->product_id,
                'product_name'  => $item->product_name,
                'sku'           => $item->sku,
                'qty_sold'      => (float) $item->qty,
                'qty_returned'  => $qtyReturned,
                'qty_remaining' => max(0, $remaining),
                // about what one unit refunds (the exact amount is worked out when you return)
                'unit_refund'   => (float) $item->qty > 0 ? round($allocated / (float) $item->qty, 2) : 0,
            ];
        })->values()->all();
    }


    public function create(User $user, int $saleId, array $data): SaleReturns
    {
        return DB::transaction(function () use ($user, $saleId, $data) {
            // locking the sale makes two refunds of the same sale wait for each other
            $sale = Sales::with('items')->lockForUpdate()->findOrFail($saleId);

            if (! in_array($sale->status, ['completed', 'partially_refunded'], true)) {
                abort(409, "Only completed or partly refunded sales can be returned (this one is {$sale->status}).");
            }

            $method = $data['refund_method'];

            // a cash refund comes out of the drawer, so it must be counted in an open shift
            if ($method === 'cash' && ! Shifts::where('user_id', $user->id)->where('status', 'open')->exists()) {
                abort(409, 'Open a shift first: a cash refund comes out of your cash drawer.');
            }

            $items    = $sale->items->keyBy('id');
            $returned = $this->returnedPerItem($sale);
            $ratio    = self::ratio((float) $sale->total, (float) $items->sum(fn($i) => (float) $i->line_total));

            $lines   = [];
            $nowQty  = []; // quantity returned in THIS request, per sale item

            foreach ($data['items'] as $row) {
                $item = $items->get((int) $row['sale_item_id']);

                if (! $item) {
                    throw ValidationException::withMessages([
                        'items' => ["Item #{$row['sale_item_id']} does not belong to this sale."],
                    ]);
                }

                $qty         = round((float) $row['qty'], 3);
                $qtySold     = (float) $item->qty;
                $qtyBefore   = (float) ($returned[$item->id]->qty ?? 0);
                $amountBefore = (float) ($returned[$item->id]->amount ?? 0);
                $remaining   = round($qtySold - $qtyBefore, 3);

                if ($qty > $remaining + 0.0001) {
                    throw ValidationException::withMessages([
                        'items' => ["Cannot return {$qty} of {$item->product_name}: only {$remaining} left to return."],
                    ]);
                }

                $lines[] = [
                    'sale_item_id' => $item->id,
                    'product_id'   => $item->product_id,
                    'qty'          => $qty,
                    'unit_price'   => (float) $item->unit_price,
                    'line_total'   => self::refundAmountToCustomer((float) $item->line_total, $ratio, $qtySold, $qtyBefore, $amountBefore, $qty),
                    'restock'      => filter_var($row['restock'] ?? true, FILTER_VALIDATE_BOOLEAN),
                ];

                $nowQty[$item->id] = $qty;
            }

            $totalRefund = round(collect($lines)->sum('line_total'), 2);

            $return = SaleReturns::create([
                'return_no'     => 'TMP-' . Str::uuid(),
                'sale_id'       => $sale->id,
                'user_id'       => $user->id,
                'total_refund'  => $totalRefund,
                'refund_method' => $method,
                'reason'        => $data['reason'],
                'returned_at'   => now(),
            ]);

            $return->update([
                'return_no' => 'RET-' . now()->format('Ymd') . '-' . str_pad((string) $return->id, 6, '0', STR_PAD_LEFT),
            ]);

            $return->items()->createMany($lines);

            // put the goods back on the shelf (skip damaged ones: restock = false)
            foreach (collect($lines)->where('restock', true)->sortBy('product_id') as $line) {
                $this->stock->move(
                    (int) $line['product_id'],
                    'return',
                    (float) $line['qty'],
                    $user->id,
                    $return,
                    "Return {$return->return_no} ({$sale->invoice_no})",
                );
            }

            // fully returned? then the sale is "refunded", otherwise "partially_refunded"
            $everythingBack = $items->every(function ($item) use ($returned, $nowQty) {
                $total = (float) ($returned[$item->id]->qty ?? 0) + (float) ($nowQty[$item->id] ?? 0);

                return abs((float) $item->qty - $total) < 0.0005;
            });

            $sale->update(['status' => $everythingBack ? 'refunded' : 'partially_refunded']);

            return $return;
        });
    }
    private function returnedPerItem(Sales $sale)
    {
        return SaleReturnItems::query()
            ->whereIn('sale_item_id', $sale->items->pluck('id'))
            ->selectRaw('sale_item_id,SUM(qty)as qty,SUM(line_total) as amount')
            ->groupBy('sale_item_id')
            ->get()
            ->keyBy('sale_item_id');
    }
}
