<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExpenseRequest extends FormRequest
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
            'category'     => ['sometimes', 'required', 'string', 'max:100'],
            'amount'       => ['sometimes', 'required', 'numeric', 'gt:0', 'max:9999999999.99'],
            'note'         => ['nullable', 'string', 'max:500'],
            'expense_date' => ['sometimes', 'required', 'date', 'before_or_equal:today'],
        ];
    }
}
