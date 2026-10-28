<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $id = (int) $this->route('product');
        return [
            'category_id'   => ['nullable', 'integer', Rule::exists('categories', 'id')->whereNull('deleted_at')],
            'brand_id'      => ['nullable', 'integer', Rule::exists('brands', 'id')->whereNull('deleted_at')],
            'supplier_id'   => ['nullable', 'integer', Rule::exists('suppliers', 'id')->whereNull('deleted_at')],

            'name'          => ['sometimes', 'required', 'string', 'max:255'],
            'sku'           => ['sometimes', 'required', 'string', 'max:100', Rule::unique('products', 'sku')->ignore($id)],
            'barcode'       => ['nullable', 'string', 'max:100', Rule::unique('products', 'barcode')->ignore($id)],
            'description'   => ['nullable', 'string', 'max:2000'],
            'image'         => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_image'  => ['nullable', 'boolean'],
            'unit'          => ['nullable', 'string', 'max:20'],

            'cost_price'    => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'sell_price'    => ['sometimes', 'required', 'numeric', 'min:0', 'max:9999999999.99'],
            'tax_rate'      => ['nullable', 'numeric', 'min:0', 'max:100'],

            'track_stock'   => ['nullable', 'boolean'],
            'reorder_level' => ['nullable', 'numeric', 'min:0', 'max:999999999'],
            'is_active'     => ['nullable', 'boolean'],

            // stock_qty is NOT accepted here on purpose: every stock change must leave a stock_movements row
        ];
    }
}
