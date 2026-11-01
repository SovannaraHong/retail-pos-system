<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleReturnResource extends JsonResource
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
            'return_no' => $this->return_no,
            'sale' => $this->whenLoaded('sale', fn() => $this->sale ?
                [
                    'id' => $this->sale->id,
                    'invoice_no' => $this->sale->invoice_no,
                    'status' => $this->sale->status
                ] : null),
            'processed_by' => $this->whenLoaded('user', fn() => $this->user ?
                ['id' => $this->user->id, 'name' => $this->user->name] : null),
            'total_refund' => (float) $this->total_refund,
            'refund_method' => $this->refund_method,
            'reason' => $this->reason,
            'returned_at' => $this->returned_at?->toISOString(),
            'item_count' => $this->items()->count(),
            'items' => SaleReturnItemResource::collection($this->whenLoaded('items')),

        ];
    }
}
