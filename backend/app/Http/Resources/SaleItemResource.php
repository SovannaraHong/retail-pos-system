<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'sale_id' => $this->sale_id, //
            'product_id'   => $this->product_id,
            'product_name' => $this->product_name,
            'sku'          => $this->sku,
            'qty'          => (float) $this->qty,
            'unit_price'   => (float) $this->unit_price,
            // what the shop paid: hidden from cashiers
            'cost_price'   => $this->when(
                $request->user('api')?->can('reports.view'),
                fn() => (float) $this->cost_price
            ),
            'discount'     => (float) $this->discount,
            'tax'          => (float) $this->tax,
            'line_total'   => (float) $this->line_total,
        ];
    }
}
