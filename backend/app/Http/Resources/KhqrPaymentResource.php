<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KhqrPaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $pending = $this->status === 'pending';

        return [
            'id'           => $this->id,
            'reference'    => $this->reference,
            'status'       => $this->status,
            'amount'       => (float) $this->amount,
            'currency'     => $this->currency,
            // the app draws this string as a QR code
            'qr'           => $this->when($pending, fn() => $this->qr),
            'md5'          => $this->md5,
            'expires_at'   => $this->expires_at?->toISOString(),
            'seconds_left' => $pending ? max(0, $this->expires_at->getTimestamp() - now()->getTimestamp()) : 0,
            'paid_at'      => $this->paid_at?->toISOString(),
            'from_account' => $this->from_account,
            'error'        => $this->error,
            'cashier'      => $this->whenLoaded('user', fn() => $this->user
                ? ['id' => $this->user->id, 'name' => $this->user->name]
                : null),
            // filled when paid: the finished sale, ready to print as a receipt
            'sale'         => $this->whenLoaded('sale', fn() => $this->sale ? new SaleResource($this->sale) : null),
            'created_at'   => $this->created_at?->toISOString(),
        ];
    }
}
