<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCustomerRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    // "012 345 678" and "012-345-678" become "012345678", so the same phone is never saved twice
    protected function prepareForValidation(): void
    {
        if ($this->filled('phone')) {
            $this->merge(['phone' => preg_replace('/[\s\-\.\(\)]/', '', (string) $this->input('phone'))]);
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],

            'phone' => [
                'nullable',
                'string',
                'max:30',
                Rule::unique('customers', 'phone')->whereNull('deleted_at'),
            ],

            'email' => [
                'nullable',
                'string',
                'email',
                'max:255',
                Rule::unique('customers', 'email')->whereNull('deleted_at'),
            ],

            'address' => ['nullable', 'string', 'max:1000'],
            'note' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
