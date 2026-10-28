<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{

    public function authorize(): bool
    {
        return true;
    }


    public function rules(): array
    {
        return [
            'category_id'   => ['nullable', 'integer', Rule::exists('categories', 'id')->whereNull('deleted_at')],
            'brand_id'      => ['nullable', 'integer', Rule::exists('brands', 'id')->whereNull('deleted_at')],
            'supplier_id'   => ['nullable', 'integer', Rule::exists('suppliers', 'id')->whereNull('deleted_at')],

            'name'          => ['required', 'string', 'max:255'],

            // leave sku empty and the server generates one
            'sku'           => ['nullable', 'string', 'max:100', 'unique:products,sku'],
            'barcode'       => ['nullable', 'string', 'max:100', 'unique:products,barcode'],
            'description'   => ['nullable', 'string', 'max:2000'],
            'image'         => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'unit'          => ['nullable', 'string', 'max:20'],

            'cost_price'    => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'sell_price'    => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'tax_rate'      => ['nullable', 'numeric', 'min:0', 'max:100'],

            'track_stock'   => ['nullable', 'boolean'],
            // opening stock only; later changes go through stock adjustments / purchases / sales
            'stock_qty'     => ['nullable', 'numeric', 'min:0', 'max:999999999'],
            'reorder_level' => ['nullable', 'numeric', 'min:0', 'max:999999999'],
            'is_active'     => ['nullable', 'boolean'],
        ];
    }
}
