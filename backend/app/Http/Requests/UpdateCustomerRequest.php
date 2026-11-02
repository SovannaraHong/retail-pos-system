<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomerRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('phone')) {
            $this->merge(['phone' => preg_replace('/[\s\-\.\(\)]/', '', (string) $this->input('phone'))]);
        }
    }
    public function rules(): array
    {
        $id = (int) $this->route('customer');

        return [
            'name'      => ['sometimes', 'required', 'string', 'max:255'],
            'phone'     => ['nullable', 'string', 'max:30', Rule::unique('customers', 'phone')->whereNull('deleted_at')->ignore($id)],
            'email'     => ['nullable', 'email', 'max:255'],
            'address'   => ['nullable', 'string', 'max:1000'],
            'note'      => ['nullable', 'string', 'max:1000'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
