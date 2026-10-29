<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSupplierRequest extends FormRequest
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
            'name'           => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('suppliers', 'name')
                    ->ignore($this->route('name'))
            ],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'phone'          => ['nullable', 'string', 'max:30'],
            'email'          => ['nullable', 'email', 'max:255'],
            'address'        => ['nullable', 'string', 'max:1000'],
            'note'           => ['nullable', 'string', 'max:1000'],
            'is_active'      => ['nullable', 'boolean'],
        ];
    }
    public function messages(): array
    {
        return [
            'name.unique' => 'This supplier name already exists.',
        ];
    }
}
