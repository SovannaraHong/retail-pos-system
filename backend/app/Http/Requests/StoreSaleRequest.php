<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSaleRequest extends FormRequest
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
            'customer_id' => [
                'nullable',
                'integer',
                Rule::exists('customers', 'id')->whereNull('deleted_at')
            ],
            // whole-receipt discount (amount). Needs the sales.discount permission.
            'discount'    => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'note'        => ['nullable', 'string', 'max:500'],


            // NO prices here: the server reads the price from the product
            'items'                => ['required', 'array', 'min:1', 'max:200'],
            'items.*.product_id'   => ['required', 'integer', 'distinct'],
            'items.*.qty'          => ['required', 'numeric', 'gt:0', 'max:999999'],
            'items.*.discount'     => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],

            'payments'             => ['required', 'array', 'min:1', 'max:5'],
            'payments.*.method'    => ['required', Rule::in(['cash', 'card', 'qr', 'bank'])],
            // amount handed over by the customer (cash can be more than the total)
            'payments.*.amount'    => ['required', 'numeric', 'gt:0', 'max:9999999999.99'],
            'payments.*.reference' => ['nullable', 'string', 'max:100'],
        ];
    }
}
