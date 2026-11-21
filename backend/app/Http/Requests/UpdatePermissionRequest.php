<?php

namespace App\Http\Requests;

use App\Http\Controllers\Api\PermissionController;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePermissionRequest extends FormRequest
{
    /**
     * Access is already enforced by the `permission:permissions.update,api`
     * route middleware, so no extra check is needed here.
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

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:100',
                'regex:/^[a-z0-9_]+\.[a-z0-9_]+$/',
                Rule::unique('permissions', 'name')
                    ->where('guard_name', PermissionController::GUARD)
                    ->ignore($this->route('permission')),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.regex' => 'Use the format resource.action, for example products.view.',
        ];
    }
}
