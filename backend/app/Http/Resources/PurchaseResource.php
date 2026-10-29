<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseResource extends JsonResource
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
            'reference_no' => $this->reference_no,
            'status'       => $this->status,
            'supplier' => $this->whenLoaded('supplier', fn() => $this->supplier
                ? [
                    'id' => $this->supplier->id,
                    'name' => $this->supplier->name
                ] : null),

            'user' => $this->whenLoaded('user', fn() => $this->user
                ? [
                    'id' => $this->user->id,
                    'name' => $this->user->name
                ] : null),

            'subtotal'     => (float) $this->subtotal,
            'discount'     => (float) $this->discount,
            'tax'          => (float) $this->tax,
            'total'        => (float) $this->total,
            'paid_amount'  => (float) $this->paid_amount,
            'balance'      => round((float) $this->total - (float) $this->paid_amount, 2),
            'note'         => $this->note,
            'purchased_at' => $this->purchased_at?->toDateString(),
            'received_at'  => $this->received_at?->toISOString(),
            'items_count'  => $this->whenCounted('items'),
            'items'        => PurchaseItemResource::collection($this->whenLoaded('items')),
            'created_at'   => $this->created_at?->toISOString(),
        ];
    }
}
