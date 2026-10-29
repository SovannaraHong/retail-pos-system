<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePurchaseRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }


    public function rules(): array
    {
        return [
            'supplier_id' => ['required', 'integer', Rule::exists('suppliers', 'id')->whereNull('deleted_at')],
            'reference_no' => ['nullable', 'string', 'max:100', 'unique:purchases,reference_no'],

            // received = add stock now, ordered = stock is added later with /receive
            'status'       => ['nullable', Rule::in(['received', 'ordered'])],
            'purchased_at' => ['nullable', 'date'],
            'discount'     => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'tax'          => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'paid_amount'  => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'note'         => ['nullable', 'string', 'max:1000'],

            'items'                => ['required', 'array', 'min:1', 'max:200'],
            'items.*.product_id'   => ['required', 'integer', 'distinct', Rule::exists('products', 'id')->whereNull('deleted_at')],
            'items.*.qty'          => ['required', 'numeric', 'gt:0', 'max:999999999'],
            'items.*.unit_cost'    => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
        ];
    }
}
