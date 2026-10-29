<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product' => $this->whenLoaded('product', fn() => $this->product
                ? [

                    'id'   => $this->product->id,
                    'name' => $this->product->name,
                    'sku'  => $this->product->sku,
                    'unit' => $this->product->unit,


                ] : null),
            'qty'        => (float) $this->qty,
            'unit_cost'  => (float) $this->unit_cost,
            'line_total' => (float) $this->line_total,
        ];
    }
}
