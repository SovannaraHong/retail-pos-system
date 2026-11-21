<?php

namespace App\Http\Requests;

use App\Http\Controllers\Api\PermissionController;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePermissionRequest extends FormRequest
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
        if (is_string($this->input('name'))) {
            $this->merge(['name' => strtolower(trim($this->input('name')))]);
        }
    }

    // public function rules(): array
    // {
    //     return [
    //         'name' => [
    //             'required',
    //             'string',
    //             'max:100',
    //             Rule::unique('permissions', 'name')->where('guard_name', 'api')
    //         ]
    //     ];
    // }
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:100',
                'regex:/^[a-z0-9_]+\.[a-z0-9_]+$/',
                Rule::unique('permissions', 'name')
                    ->where('guard_name', PermissionController::GUARD),
            ],
        ];
    }
    public function messages(): array
    {
        return [
            'name.regex' => 'Use the format resource.action, for example products.view.',
        ];
    }
}
