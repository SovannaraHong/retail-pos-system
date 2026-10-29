<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockMovementResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [

            'id'         => $this->id,
            'type'       => $this->type,
            'qty_change' => (float) $this->qty_change,
            'qty_before' => (float) $this->qty_before,
            'qty_after'  => (float) $this->qty_after,
            'note'       => $this->note,
            'product'    => $this->whenLoaded('product', fn() => $this->product
                ? ['id' => $this->product->id, 'name' => $this->product->name, 'sku' => $this->product->sku]
                : null),
            'user'       => $this->whenLoaded('user', fn() => $this->user
                ? ['id' => $this->user->id, 'name' => $this->user->name]
                : null),
            // what caused it: "Purchase", "Sale"... with its id
            'reference'  => $this->reference_type
                ? ['type' => class_basename($this->reference_type), 'id' => $this->reference_id]
                : null,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
