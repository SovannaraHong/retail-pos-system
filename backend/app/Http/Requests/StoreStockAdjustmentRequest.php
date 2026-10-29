<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStockAdjustmentRequest extends FormRequest
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
            'product_id'  => ['required', 'integer', Rule::exists('products', 'id')->whereNull('deleted_at')],
            'type'        => ['nullable', Rule::in(['adjustment', 'damage'])],

            // send EITHER qty_change (+/-) OR counted_qty (what you counted on the shelf)
            'qty_change'  => ['required_without:counted_qty', 'prohibits:counted_qty', 'nullable', 'numeric', 'between:-999999999,999999999'],
            'counted_qty' => ['required_without:qty_change', 'prohibits:qty_change', 'nullable', 'numeric', 'min:0', 'max:999999999'],

            // a reason is required so every adjustment can be audited
            'note'        => ['required', 'string', 'max:500'],
        ];
    }
}
