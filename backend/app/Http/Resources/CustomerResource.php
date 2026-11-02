<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $attrs = $this->resource->getAttributes();
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'phone'       => $this->phone,
            'email'       => $this->email,
            'address'     => $this->address,
            'note'        => $this->note,
            'points'      => (int) $this->points,
            'is_active'   => (bool) $this->is_active,

            //all sales except void ones (before refunds)

            'sales_count' => $this->when(array_key_exists(
                'sales_count',
                $attrs
            ), fn() => (int)$this->sale_count),
            'total_sales' => $this->when(array_key_exists(
                'total_sales',
                $attrs
            ), fn() => round((float)$this->total_sales, 2)),

            'total_refunds' => $this->when(array_key_exists(
                'total_refunds',
                $attrs
            ), fn() => round((float)$this->total_refunds, 2)),
            'net_spent' => $this->when(array_key_exists(
                'net_spent',
                $attrs
            ), fn() => round((float)$this->net_spent, 2)),


            'created_at'  => $this->created_at?->toISOString(),
            'updated_at'  => $this->updated_at?->toISOString(),
            'deleted_at'  => $this->deleted_at?->toISOString(),


        ];
    }
}
