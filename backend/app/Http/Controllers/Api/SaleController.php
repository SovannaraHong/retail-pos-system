<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSaleRequest;
use App\Http\Requests\VoidSaleRequest;
use App\Http\Resources\SaleResource;
use App\Models\Products;
use App\Models\Sales;
use App\Models\Shifts;
use App\Services\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

class SaleController extends Controller
{

    private const ALLOW_NEGATIVE_STOCK = false;


    private function canSeeAll(Request $request): bool
    {
        return (bool)$request->user('api')->can('report.view');
    }
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date']
        ]);

        $user = $request->user('api');

        $sales = Sales::query()
            ->with(['user:id,name', 'customer:id,name'])
            ->withCount('items')
            ->when(!$this->canSeeAll($request), fn($q) => $q->where('user_id', $user->id))

            ->when($request->filled('user_id'), fn($q) =>
            $q->where('user_id', $request->integer('user_id')))

            ->when($request->filled('search'), fn($q) =>
            $q->where('invoice_no', 'like', '%' . $request->input('search') . '%'))
            ->when($request->filled('status'), fn($q) =>
            $q->where('status', (string) $request->input('status')))
            ->when($request->filled('customer_id'), fn($q) =>
            $q->where('customer_id', $request->integer('customer_id')))
            ->when($request->filled('shift_id'), fn($q) =>
            $q->where('shift_id', $request->integer('shift_id')))
            ->when($request->filled('date_from'), fn($q) =>
            $q->whereDate('sold_at', '>=', $request->input('date_from')))
            ->when($request->filled('date_to'), fn($q) =>
            $q->whereDate('sold_at', '<=', $request->input('date_to')))
            ->latest('sold_at')
            ->latest('id')
            ->paginate(min($request->integer('per_page', 15), 100));

        return SaleResource::collection($sales);
    }





    public function show(Request $request, int $id): SaleResource
    {
        //
        $sale = Sales::with(['user:id,name', 'customer:id,name', 'items', 'payments'])->findOrFail($id);
        if (!$this->canSeeAll($request) && $sale->user_id !== $request->user('api')->id) {
            abort(404);
        }
        return new SaleResource($sale);
    }

    // ---------------- CHECKOUT ----------------
    public function store(StoreSaleRequest $request, StockService $stock): JsonResponse
    {
        $user    = $request->user('api');
        $data    = $request->validated();
        $itemsIn = collect($data['items']);

        $wantsDiscount = (float) ($data['discount'] ?? 0) > 0
            || $itemsIn->contains(fn($i) => (float) ($i['discount'] ?? 0) > 0);

        if ($wantsDiscount && ! $user->can('sales.discount')) {
            abort(403, 'You are not allowed to give discounts.');
        }

        $sale = DB::transaction(function () use ($data, $itemsIn, $user, $stock) {

            // 1) a cashier must have an open shift: cash is counted per shift
            $shift = Shifts::where('user_id', $user->id)
                ->where('status', 'open')
                ->lockForUpdate()
                ->first();

            if (! $shift) {
                abort(409, 'Open a shift before selling.');
            }

            // 2) load and lock the products in id order (prevents deadlocks)
            $ids = $itemsIn->pluck('product_id')->map(fn($v) => (int) $v)->sort()->values();

            $products = Products::query()
                ->whereIn('id', $ids)
                ->where('is_active', true)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            foreach ($ids as $id) {
                if (! $products->has($id)) {
                    throw ValidationException::withMessages([
                        'items' => ["Product #{$id} is not available for sale."],
                    ]);
                }
            }

            // 3) price every line from the DATABASE (tax is added on top of the price)
            $lines = $itemsIn->map(function ($item) use ($products) {
                $product = $products[(int) $item['product_id']];

                $qty     = round((float) $item['qty'], 3);
                $price   = round((float) $product->sell_price, 2);
                $gross   = round($qty * $price, 2);
                $disc    = round((float) ($item['discount'] ?? 0), 2);

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

            // 4) payments: what the customer handed over, change comes back from cash
            $payments = collect($data['payments'])->map(fn($p) => [
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

            // 5) save the sale
            $sale = Sales::create([
                'invoice_no'    => 'TMP-' . Str::uuid(),
                'user_id'       => $user->id,
                'customer_id'   => $data['customer_id'] ?? null,
                'shift_id'      => $shift->id,
                'subtotal'      => $subtotal,
                'discount'      => round($lineDiscount + $orderDiscount, 2),
                'tax'           => $tax,
                'total'         => $total,
                'paid_amount'   => $tendered,
                'change_amount' => $change,
                'status'        => 'completed',
                'note'          => $data['note'] ?? null,
                'sold_at'       => now(),
            ]);

            // invoice number from the id: unique, never repeats, no race condition
            $sale->update([
                'invoice_no' => 'INV-' . now()->format('Ymd') . '-' . str_pad((string) $sale->id, 6, '0', STR_PAD_LEFT),
            ]);

            $sale->items()->createMany($lines->all());
            $sale->payments()->createMany($payments->all());

            // 6) take the stock out (throws 422 and rolls everything back if not enough)
            foreach ($lines->sortBy('product_id') as $line) {
                $stock->move(
                    $line['product_id'],
                    'sale',
                    -$line['qty'],
                    $user->id,
                    $sale,
                    "Sale {$sale->invoice_no}",
                    self::ALLOW_NEGATIVE_STOCK,
                );
            }

            return $sale;
        });

        return (new SaleResource($sale->load(['user:id,name', 'customer:id,name', 'items', 'payments'])))
            ->response()
            ->setStatusCode(201);
    }


    // cancel a mistaken sale: stock goes back, the sale stays in the books as "voided"
    public function void(VoidSaleRequest $request, int $id, StockService $stock): SaleResource
    {
        $userId = $request->user('api')->id;

        $sale = DB::transaction(function () use ($request, $id, $userId, $stock) {
            $sale = Sales::with('items')->lockForUpdate()->findOrFail($id);

            if ($sale->status !== 'completed') {
                abort(409, 'Only completed sales can be voided.');
            }

            if ($sale->returns()->exists()) {
                abort(409, 'This sale already has returns, so it cannot be voided.');
            }

            foreach ($sale->items->sortBy('product_id') as $item) {
                $stock->move(
                    $item->product_id,
                    'return',
                    (float) $item->qty,
                    $userId,
                    $sale,
                    "Void {$sale->invoice_no}",
                );
            }

            $sale->update([
                'status' => 'voided',
                'note'   => trim(($sale->note ? $sale->note . "\n" : '') . '[VOID] ' . $request->validated('reason')),
            ]);

            return $sale;
        });

        return new SaleResource($sale->load(['user:id,name', 'customer:id,name', 'items', 'payments']));
    }
}
