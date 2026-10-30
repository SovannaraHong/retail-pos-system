<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShiftResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array


    {

        $hasSummary = array_key_exists('summary', $this->resource->getAttributes());
        return [
            'id' => $this->id,
            'status' => $this->status,
            'user' => $this->whenLoaded('user', fn($q) => $this->user ?
                ['id' => $this->user->id, 'name' => $this->user->name] : null),
            'opening_cash' => $this->opening_cash,
            'closing_cash' => $this->closing_cash !== null ? (float)$this->closing_cash : null,
            'expected_cash' => $this->expected_cash !== null ? (float)$this->expected_cash : null,
            'difference'    => $this->difference !== null ? (float) $this->difference : null, // + over, - short
            'note'          => $this->note,
            'opened_at'     => $this->opened_at?->toISOString(),
            'closed_at'     => $this->closed_at?->toISOString(),
            'summary' => $this->when($hasSummary, fn() => $this->resource->getAttribute('summary')),
        ];
    }
}
