<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePurchaseRequest;
use App\Http\Resources\PurchaseResource;
use App\Models\Products;
use App\Models\Purchases;
use App\Services\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

class PurchaseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date']
        ]);

        $purchases = Purchases::query()
            ->with(['supplier:id,name', 'user:id,name'])
            ->when($request->filled('search'), fn($q) =>
            $q->where('reference_no', 'like', '%' . $request->input('search') . '%'))

            ->when($request->filled('supplier_id'), fn($q) =>
            $q->where('supplier_id', $request->integer('supplier_id')))

            ->when($request->filled('status'), fn($q) =>
            $q->where('status', (string) $request->input('status')))

            ->when($request->filled('date_from'), fn($q) =>
            $q->whereDate('purchased_at', '>=', $request->input('date_from')))

            ->when($request->filled('date_to'), fn($q) =>
            $q->whereDate('purchased_at', '<=', $request->input('date_to')))

            ->latest('purchased_at')
            ->latest('id')
            ->paginate(min($request->integer('per_page', 15), 100));
        return PurchaseResource::collection($purchases);
    }


    public function show(int $id): PurchaseResource
    {
        $purchase = Purchases::with([
            'supplier:id,name',
            'user:id,name',
            'item.product:id,name,sku,unit',
        ])->withCount('items')->findOrFail($id);
        return new PurchaseResource($purchase);
    }


    public function store(StorePurchaseRequest $request, StockService $stock): JsonResponse
    {
        $data = $request->validated();
        $status = $data['status'] ?? 'received';
        $userId = $request->user('api')->id;



        // the server calculates the money, the client only sends qty and unit cost


        $lines = collect($data['items'])->map(function ($item) {
            $qty = round((float)$item['qty'], 3);
            $cost = round((float)$item['unit_cost'], 2);

            return [
                'product_id' => (int) $item['product_id'],
                'qty' => $qty,
                'unit_cost'  => $cost,
                'line_total' => round($qty * $cost, 2),
            ];
        })->sortBy('product_id')->values();


        $subtotal = round($lines->sum('line_total'), 2);
        $discount = round((float) ($data['discount'] ?? 0), 2);
        $tax      = round((float) ($data['tax'] ?? 0), 2);
        $total    = round($subtotal - $discount + $tax, 2);
        $paid     = round((float) ($data['paid_amount'] ?? 0), 2);


        if ($total < 0) {
            throw ValidationException::withMessages(['discount' => ['Discount is bigger than the purchase total.']]);
        }

        if ($paid > $total) {
            throw ValidationException::withMessages(['paid_amount' => ['Paid amount is bigger than the total.']]);
        }

        $purchase = DB::transaction(function () use (
            $data,
            $status,
            $userId,
            $lines,
            $subtotal,
            $discount,
            $tax,
            $total,
            $paid,
            $stock
        ) {
            $purchase = Purchases::create([
                'reference_no' => $data['reference_no'] ?? $this->generateReference(),
                'supplier_id'  => $data['supplier_id'],
                'user_id'      => $userId,
                'status'       => $status,
                'subtotal'     => $subtotal,
                'discount'     => $discount,
                'tax'          => $tax,
                'total'        => $total,
                'paid_amount'  => $paid,
                'note'         => $data['note'] ?? null,
                'purchased_at' => $data['purchased_at'] ?? now()->toDateString(),
                'received_at'  => $status === 'received' ? now() : null,
            ]);

            $purchase->items()->createMany($lines->all());

            if ($status === 'received') {
                $this->receiveStock($purchase->load('items'), $stock, $userId);
            }

            return $purchase;
        });
        return (new PurchaseResource($purchase->load(['supplier:id,name', 'user:id,name', 'items.product:id,name,sku,unit'])))
            ->response()
            ->setStatusCode(201);
    }

    // an "ordered" purchase arrives: add the stock now
    public function receive(Request $request, int $id, StockService $stock): PurchaseResource
    {
        $userId = $request->user('api')->id;

        $purchase = DB::transaction(function () use ($id, $userId, $stock) {
            $purchase = Purchases::with('items')->lockForUpdate()->findOrFail($id);

            if ($purchase->status !== 'ordered') {
                abort(409, 'Only purchases with status "ordered" can be received.');
            }

            $this->receiveStock($purchase, $stock, $userId);

            $purchase->update(['status' => 'received', 'received_at' => now()]);

            return $purchase;
        });

        return new PurchaseResource($purchase->load(['supplier:id,name', 'user:id,name', 'items.product:id,name,sku,unit']));
    }



    public function cancel(int $id): PurchaseResource
    {
        $purchase = DB::transaction(function () use ($id) {
            $purchase = Purchases::lockForUpdate()->findOrFail($id);

            if ($purchase->status !== 'ordered') {
                abort(409, 'Only purchases with status "ordered" can be cancelled. Received stock is
                 corrected with a stock adjustment.');
            }

            $purchase->update(['status' => 'cancelled']);

            return $purchase;
        });

        return new PurchaseResource($purchase->load(['supplier:id,name', 'user:id,name']));
    }


    // adds the stock for every line and remembers the newest cost price
    private function receiveStock(Purchases $purchase, StockService $stock, int $userId): void
    {
        foreach ($purchase->items->sortBy('product_id') as $item) {
            $stock->move(
                $item->product_id,
                'purchase',
                (float) $item->qty,
                $userId,
                $purchase,
                "Purchase {$purchase->reference_no}",
            );

            // latest cost. Old sales are not affected: sale_items keeps its own copy of the cost.
            Products::whereKey($item->product_id)->update(['cost_price' => $item->unit_cost]);
        }
    }

    private function generateReference(): string
    {
        do {
            $ref = 'PO-' . now()->format('Ymd') . '-' . strtoupper(Str::random(4));
        } while (Purchases::where('reference_no', $ref)->exists());

        return $ref;
    }
}
