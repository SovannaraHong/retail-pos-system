<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CloseShiftRequest extends FormRequest
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
            // the cash the cashier actually counted in the drawer
            'closing_cash' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'note'         => ['nullable', 'string', 'max:500'],
        ];
    }
}
