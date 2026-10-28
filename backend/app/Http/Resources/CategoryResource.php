<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
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
            'name'           => $this->name,
            'description'    => $this->description,
            'is_active'      => $this->is_active,
            'parent_id'      => $this->parent_id,

            'parent' => $this->whenLoaded('parent', fn() => $this->parent
                ? ['id' => $this->parent->id, 'name' => $this->parent->name]
                : null),
            'products_count' => $this->whenCounted('products'),
            'children_count' => $this->whenCounted('children'),
            'created_at'     => $this->created_at?->toISOString(),
            'updated_at'     => $this->updated_at?->toISOString(),
            'deleted_at'     => $this->deleted_at?->toISOString(),
        ];
    }
}
