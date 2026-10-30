<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'invoice_no'    => $this->invoice_no,
            'status'        => $this->status,
            'cashier'       => $this->whenLoaded('user', fn() => $this->user
                ? ['id' => $this->user->id, 'name' => $this->user->name]
                : null),
            'customer'      => $this->whenLoaded('customer', fn() => $this->customer
                ? ['id' => $this->customer->id, 'name' => $this->customer->name]
                : null),
            'shift_id'      => $this->shift_id,
            'subtotal'      => (float) $this->subtotal,
            'discount'      => (float) $this->discount,
            'tax'           => (float) $this->tax,
            'total'         => (float) $this->total,
            'paid_amount'   => (float) $this->paid_amount,    // what the customer handed over
            'change_amount' => (float) $this->change_amount,  // what was given back
            'note'          => $this->note,

            'sold_at'       => $this->sold_at?->toISOString(),
            'items_count'   => $this->whenCounted('items'),
            'items'         => SaleItemResource::collection($this->whenLoaded('items')),
            'payments'      => PaymentResource::collection($this->whenLoaded('payments')),
        ];
    }
}
