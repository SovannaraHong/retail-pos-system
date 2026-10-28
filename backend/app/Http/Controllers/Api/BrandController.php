<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBrandRequest;
use App\Http\Requests\UpdateBrandRequest;
use App\Http\Resources\BrandResource;
use App\Models\Brands;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BrandController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $brands = Brands::query()
            ->withCount('products')
            ->when($request->filled('search'), fn($q) =>
            $q->where('name', 'like', '%' . $request->input('search') . '%'))
            ->when($request->filled('is_active'), fn($q) =>
            $q->where('is_active', $request->boolean('is_active')))
            ->when($request->boolean('only_trashed'), fn($q) => $q->onlyTrashed())
            ->orderBy('name')
            ->paginate(min($request->integer('per_page', 15), 100));

        return BrandResource::collection($brands);
    }


    public function store(StoreBrandRequest $request): JsonResponse
    {
        $brand = Brands::create($request->validated());
        return (new BrandResource($brand))->response()->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): BrandResource
    {
        return new BrandResource(
            Brands::withTrashed()->withCount('products')->findOrFail($id)
        );
    }


    public function update(UpdateBrandRequest $request, int $id): BrandResource
    {
        $brand = Brands::findOrFail($id);
        $brand->update($request->validated());
        return new BrandResource($brand->fresh()->loadCount('products'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id)
    {
        $brand = Brands::withCount('products')->findOrFail($id);


        if ($brand->products_count > 0) {
            return response()->json([
                'message' => "Cannot delete: {$brand->products_count} product(s) use this brand.",
            ], 409);
        }

        $brand->delete();
        return response()->json(null, 204);
    }


    public function restore(int $id): BrandResource
    {
        $brand = Brands::onlyTrashed()->findOrFail($id);
        $brand->restore();
        return new BrandResource($brand);
    }
}
