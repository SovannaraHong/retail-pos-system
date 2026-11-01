<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSaleReturnRequest;
use App\Http\Resources\SaleReturnResource;
use App\Models\SaleReturns;
use App\Models\Sales;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use App\Services\ReturnService;

class SaleReturnController extends Controller
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

        $returns = SaleReturns::query()
            ->with(['sale:id,invoice_no,status', 'user:id,name'])
            ->withCount('items')
            ->when($request->filled('sale_id'), fn($q,) =>
            $q->where('sale_id', $request->integer('sale_id')))
            ->when($request->filled('user_id'), fn($q,) =>
            $q->where('user_id', $request->integer('user_id')))
            ->when($request->filled('refund_method'), fn($q) =>
            $q->where('refund_method', (string)$request->input('refund_method')))
            ->when($request->filled('search'), fn($q) =>
            $q->where('return_no', 'like', '%' . $request->input('search') . '%'))
            ->when($request->filled('date_from'), fn($q) =>
            $q->whereDate('returned_at', '>=', $request->input('date_from')))
            ->when($request->filled('date_to'), fn($q) =>
            $q->whereDate('returned_at', '<=', $request->input('date_to')))
            ->latest('returned_at')
            ->latest('id')
            ->paginate(min($request->input('per_page', 15), 100));
        return SaleReturnResource::collection($returns);
    }

    // step 1 of a return: what is left to return on this sale?
    public function returnable(int $id, ReturnService $service): JsonResponse
    {
        $sale = Sales::with('items')->findOrFail($id);

        return response()->json([
            'data' => [
                'sale_id'    => $sale->id,
                'invoice_no' => $sale->invoice_no,
                'status'     => $sale->status,
                'items'      => $service->returnable($sale),
            ],
        ]);
    }

    // step 2: do the return
    public function store(StoreSaleReturnRequest $request, int $id, ReturnService $service): JsonResponse
    {
        $return = $service->create($request->user('api'), $id, $request->validated());

        return (new SaleReturnResource(
            $return->load(['sale:id,invoice_no,status', 'user:id,name', 'items.saleItem:id,product_name,sku'])
        ))->response()->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): SaleReturnResource
    {
        //
        $return = SaleReturns::with([
            'sale:id,invoice_no,status,',
            'user:id,name',
            'items.saleItem:id,product_name,sku'
        ])->findOrFail($id);
        return new SaleReturnResource($return);
    }
}
