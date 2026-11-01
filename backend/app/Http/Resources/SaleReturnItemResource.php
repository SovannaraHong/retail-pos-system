<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleReturnItemResource extends JsonResource
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
            'sale_item_id' => $this->sale_item_id,
            'product_id' => $this->product_id,
            'product_name' => $this->whenLoaded('saleItem', fn() => $this->saleItem?->product_name),
            'sku' => $this->whenLoaded('saleItem', fn() => $this->saleItem?->sku),
            'qty' => (float) $this->qty,
            'unit_price' => (float) $this->unit_price,
            'refund' => (float) $this->line_total,
            'restock' => $this->restock,
        ];
    }
}
