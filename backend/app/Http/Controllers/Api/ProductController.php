<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Products;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{


    private const DISK = 's3';

    private const RELATIONS = ['category:id,name', 'brand:id,name', 'supplier:id,name'];


    public function index(Request $request): AnonymousResourceCollection
    {
        $products = Products::query()
            ->with(self::RELATIONS)
            ->when($request->filled('search'), function ($q) use ($request) {
                $s = (string) $request->input('search');
                $q->where(fn($q) => $q
                    ->where('name', 'like', "%{$s}%")
                    ->orWhere('sku', 'like', "%{$s}%")
                    ->orWhere('barcode', 'like', "%{$s}%"));
            })
            ->when($request->filled('category_id'), fn($q) =>
            $q->where('category_id', $request->integer('category_id')))

            ->when($request->filled('brand_id'), fn($q) =>
            $q->where('brand_id', $request->integer('brand_id')))

            ->when($request->filled('supplier_id'), fn($q) =>
            $q->where('supplier_id', $request->integer('supplier_id')))

            ->when($request->filled('is_active'), fn($q) =>
            $q->where('is_active', $request->boolean('is_active')))

            ->when($request->boolean('low_stock'), fn($q) => $q->lowStock())
            ->when($request->boolean('only_trashed'), fn($q) => $q->onlyTrashed())
            ->orderBy('name')
            ->paginate(min($request->integer('per_page', 15), 100));

        return ProductResource::collection($products);
    }

    // checkout screen: scan a barcode (or type a sku) and get ONE active product
    public function findByCode(string $code): ProductResource
    {
        $product = Products::query()
            ->with(self::RELATIONS)
            ->where('is_active', true)
            ->where(fn($q) => $q->where('barcode', $code)->orWhere('sku', $code))
            ->firstOrFail();

        return new ProductResource($product);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $data = $request->safe()->except(['image']);

        $data['sku'] = $data['sku'] ?? $this->generateSku();


        $trackStock = filter_var($data['track_stock'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $openingQty = $trackStock ? (float)($data['stock_qty'] ?? 0) : 00;
        $data['stock_qty'] = $openingQty;

        $path = null;


        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', self::DISK);
            $data['image'] = $path;
        }

        try {
            $product = DB::transaction(function () use ($data, $openingQty, $request) {
                $product = Products::create($data);

                // opening stock leaves a history row, like every other stock change
                if ($openingQty > 0) {
                    StockMovement::create([
                        'product_id' => $product->id,
                        'user_id'    => $request->user('api')->id,
                        'type'       => 'initial',
                        'qty_change' => $openingQty,
                        'qty_before' => 0,
                        'qty_after'  => $openingQty,
                        'note'       => 'Opening stock',
                    ]);
                }

                return $product;
            });
        } catch (\Throwable $e) {
            if ($path) {
                Storage::disk(self::DISK)->delete($path);
            }
            throw $e;
        }

        return (new ProductResource($product->load(self::RELATIONS)))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): ProductResource
    {
        return new ProductResource(
            Products::withTrashed()->with(self::RELATIONS)->findOrFail($id)
        );
    }


    public function update(UpdateProductRequest $request, int $id): ProductResource
    {
        $product = Products::findOrFail($id);

        $data = $request->safe()->except(['image', 'remove_image']);

        $oldImage = $product->image;
        $newPath = null;


        if ($request->hasFile('image')) {
            $newPath = $request->file('image')->store('products', self::DISK);
            $data['image'] = $newPath;
        } elseif ($request->boolean('remove_image')) {
            $data['image'] = null;
        }
        try {
            $product->update($data);
        } catch (\Throwable $e) {
            //throw $th;
            if ($newPath) {
                Storage::disk(self::DISK)->delete($newPath);
            }
            throw $e;
        }
        if ($oldImage && array_key_exists('image', $data) && $data['image'] !== $oldImage) {
            Storage::disk(self::DISK)->delete($oldImage);
        }
        return new ProductResource($product->fresh()->load(self::RELATIONS));
    }

    // soft delete: old sales keep their own copy of name/price, and the image stays so it can be restored
    public function destroy(int $id): JsonResponse
    {
        Products::findOrFail($id)->delete();

        return response()->json(null, 204);
    }



    public function restore(int $id): ProductResource
    {
        $product = Products::onlyTrashed()->findOrFail($id);
        $product->restore();

        return new ProductResource($product->load(self::RELATIONS));
    }
    private function generateSku(): string
    {
        do {
            $sku = 'P' . strtoupper(Str::random(7));
        } while (Products::withTrashed()->where('sku', $sku)->exists());

        return $sku;
    }
}
