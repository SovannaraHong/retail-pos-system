<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSaleRequest;
use App\Http\Requests\VoidSaleRequest;
use App\Http\Resources\SaleResource;
use App\Models\Products;
use App\Models\Sales;
use App\Models\Shifts;
use App\Services\CheckoutService;
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
    public function store(StoreSaleRequest $request, CheckoutService $checkout): JsonResponse
    {
        $sale = $checkout->checkout(
            $request->user('api'),
            $request->validated(),
            self::ALLOW_NEGATIVE_STOCK,
        );

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
