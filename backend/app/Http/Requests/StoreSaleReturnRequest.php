<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSaleReturnRequest extends FormRequest
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
            // how the money goes back. "qr" means you send it yourself in the Bakong app; the POS only records it.
            'refund_method'        => ['required', Rule::in(['cash', 'card', 'bank', 'qr'])],
            'reason'               => ['required', 'string', 'max:255'],

            'items'                => ['required', 'array', 'min:1', 'max:200'],
            'items.*.sale_item_id' => ['required', 'integer', 'distinct'],
            'items.*.qty'          => ['required', 'numeric', 'gt:0', 'max:999999'],
            // false = damaged, do not add back to stock
            'items.*.restock'      => ['nullable', 'boolean'],
        ];
    }
}
