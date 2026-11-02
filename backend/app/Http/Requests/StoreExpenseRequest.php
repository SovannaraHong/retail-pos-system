<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreExpenseRequest extends FormRequest
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
            'category'     => ['required', 'string', 'max:100'],   // rent, electricity, salary, transport...
            'amount'       => ['required', 'numeric', 'gt:0', 'max:9999999999.99'],
            'note'         => ['nullable', 'string', 'max:500'],
            'expense_date' => ['nullable', 'date', 'before_or_equal:today'], // empty = today
        ];
    }
}
