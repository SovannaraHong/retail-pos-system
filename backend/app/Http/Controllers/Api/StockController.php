<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStockAdjustmentRequest;
use App\Http\Resources\StockMovementResource;
use App\Models\Products;
use App\Models\StockMovement;
use App\Services\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockController extends Controller
{
    public function movements(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date']
        ]);
        $movements = StockMovement::query()
            ->withCount(['product:id,name,sku', 'user:id,name'])
            ->when($request->filled('product_id'), fn($q) =>
            $q->where('product_id', $request->integer('product_id')))

            ->when($request->filled('user_id'), fn($q) =>
            $q->where('user_id', $request->integer('user_id')))
            ->when($request->filled('type'), fn($q) =>
            $q->where('type', (string)$request->input('type')))
            ->when($request->filled('date_from'), fn($q) =>
            $q->where('date_from', $request->input('date_from')))
            ->when($request->filled('date_to'), fn($q) =>
            $q->whereDate('created_at', '<=', $request->input('date_to')))
            ->latest('id')
            ->paginate(min($request->integer('per_page', 20), 100));

        return StockMovementResource::collection($movements);
    }

    public function adjust(StoreStockAdjustmentRequest $request, StockService $stock): JsonResponse
    {
        $data = $request->validated();
        $type = $data['type'] ?? 'adjustment';
        $userId = $request->user('api')->id;


        $movement = DB::transaction(function () use ($data, $type, $userId, $stock) {
            $product = Products::lockForUpdate()->findOrFail($data['product_id']);


            if (! $product->track_stock) {
                throw ValidationException::withMessages([
                    'product_id' => ['This product does not track stock.'],
                ]);
            }

            // counted_qty = "I counted 42 on the shelf", the server works out the difference

            $change = isset($data['counted_qty'])
                ? round((float)$data['counted_qty'] - (float)$product->stock_qty, 3)
                : round((float)$data['qty_change'], 3);

            if ($change == 0.0) {
                throw ValidationException::withMessages([
                    'qty_change' => ['Nothing to change: the stock is already at that quantity.'],
                ]);
            }
            if ($type === 'damage' && $change > 0) {
                throw ValidationException::withMessages([
                    'type' => ['Damage must reduce stock. Use a negative qty_change.'],
                ]);
            }
            return $stock->move($product->id, $type, $change, $userId, null, $data['note']);
        });
        return (new StockMovementResource($movement->load(['product:id,name,sku', 'user:id,name'])))
            ->response()
            ->setStatusCode(201);
    }
}
