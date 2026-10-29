<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSupplierRequest;
use App\Http\Requests\UpdateSupplierRequest;
use App\Http\Resources\SupplierResource;
use App\Models\Suppliers;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SupplierController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {

        $suppliers = Suppliers::query()
            ->withCount('products')
            ->when($request->filled('search'), function ($q) use ($request) {
                $s = (string) $request->input('search');
                $q->where(fn($q) => $q
                    ->where('name', 'like', "%{$s}%")
                    ->orWhere('contact_person', 'like', "%{$s}%")
                    ->orWhere('phone', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%"));
            })
            ->when($request->filled('is_active'), fn($q) =>
            $q->where('is_active', $request->boolean('is_active')))
            ->when($request->filled('only_trash'), fn($q) => $q->onlyTrashed())
            ->orderBy('name')
            ->paginate(min($request->integer('per_page', 15), 100));
        return SupplierResource::collection($suppliers);
    }

    public function store(StoreSupplierRequest $request): JsonResponse
    {
        $supplier = Suppliers::create($request->validated());
        return (new SupplierResource($supplier))
            ->response()->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): SupplierResource
    {
        // $supplier = Suppliers::withTrashed()->findOrFail($id);
        // return new SupplierResource($supplier);

        return new SupplierResource(Suppliers::withTrashed()->findOrFail($id));
    }


    public function update(UpdateSupplierRequest $request, int $id): SupplierResource
    {
        $supplier = Suppliers::findOrFail($id);
        $supplier->update($request->validated());
        return new SupplierResource($supplier->fresh()->loadCount('products'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id)
    {
        $supplier = Suppliers::withCount('products')->findOrFail($id);

        if ($supplier->product_count > 0) {
            return response()->json([
                'message' => "Cannot delete: {$supplier->products_count} product(s) use this supplier.",
            ], 409);
        }
        $supplier->delete(); // soft delete

        return response()->json(null, 204);
    }

    public function  restore(int $id): SupplierResource
    {
        $supplier = Suppliers::onlyTrashed()->findOrFail($id);

        $supplier->restore();
        return new SupplierResource($supplier);
    }
}
