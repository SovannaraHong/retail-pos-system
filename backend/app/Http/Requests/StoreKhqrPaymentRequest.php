<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreKhqrPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    // the same cart as a normal sale, but with no "payments": the QR is the payment
    public function rules(): array
    {
        return [
            'customer_id'        => ['nullable', 'integer', Rule::exists('customers', 'id')->whereNull('deleted_at')],
            'discount'           => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'note'               => ['nullable', 'string', 'max:500'],

            'items'              => ['required', 'array', 'min:1', 'max:200'],
            'items.*.product_id' => ['required', 'integer', 'distinct'],
            'items.*.qty'        => ['required', 'numeric', 'gt:0', 'max:999999'],
            'items.*.discount'   => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
        ];
    }
}
