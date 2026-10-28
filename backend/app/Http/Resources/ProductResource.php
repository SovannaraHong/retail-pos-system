<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $trackStock = (bool) $this->track_stock;

        return [
            'id'            => $this->id,
            'name'          => $this->name,
            'sku'           => $this->sku,
            'barcode'       => $this->barcode,
            'description'   => $this->description,
            'image'         => $this->image,
            'image_url'     => $this->image_url,
            'unit'          => $this->unit,

            // cashiers do not see what the shop paid; only users who can edit products do
            'cost_price'    => $this->when(
                $request->user('api')?->can('products.update'),
                fn() => (float) $this->cost_price
            ),
            'sell_price'    => (float) $this->sell_price,
            'tax_rate'      => (float) $this->tax_rate,

            'track_stock'   => $trackStock,
            'stock_qty'     => (float) $this->stock_qty,
            'reorder_level' => (float) $this->reorder_level,
            'is_low_stock'  => $trackStock && (float) $this->stock_qty <= (float) $this->reorder_level,
            'is_active'     => (bool) $this->is_active,

            'category'      => $this->whenLoaded('category', fn() => $this->category
                ? ['id' => $this->category->id, 'name' => $this->category->name]
                : null),
            'brand'         => $this->whenLoaded('brand', fn() => $this->brand
                ? ['id' => $this->brand->id, 'name' => $this->brand->name]
                : null),
            'supplier'      => $this->whenLoaded('supplier', fn() => $this->supplier
                ? ['id' => $this->supplier->id, 'name' => $this->supplier->name]
                : null),

            'created_at'    => $this->created_at?->toISOString(),
            'updated_at'    => $this->updated_at?->toISOString(),
            'deleted_at'    => $this->deleted_at?->toISOString(),
        ];
    }
}
