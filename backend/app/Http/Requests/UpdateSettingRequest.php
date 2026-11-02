<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingRequest extends FormRequest
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
            'store_name'     => ['sometimes', 'nullable', 'string', 'max:100'],
            'store_phone'    => ['sometimes', 'nullable', 'string', 'max:30'],
            'store_address'  => ['sometimes', 'nullable', 'string', 'max:255'],
            'store_email'    => ['sometimes', 'nullable', 'email', 'max:100'],
            'tax_id'         => ['sometimes', 'nullable', 'string', 'max:50'],   // VAT / TIN number printed on receipts
            'receipt_header' => ['sometimes', 'nullable', 'string', 'max:255'],
            'receipt_footer' => ['sometimes', 'nullable', 'string', 'max:255'],  // "Thank you, come again!"
        ];
    }
}
