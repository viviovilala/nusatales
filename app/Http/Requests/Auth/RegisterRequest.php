<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $merge = [];

        if (! $this->has('name') && $this->has('nama')) {
            $merge['name'] = $this->input('nama');
        }

        if (! $this->has('password_confirmation') && $this->has('passwordConfirm')) {
            $merge['password_confirmation'] = $this->input('passwordConfirm');
        }

        if (! $this->has('password_confirmation') && $this->has('confirmPassword')) {
            $merge['password_confirmation'] = $this->input('confirmPassword');
        }

        if ($merge !== []) {
            $this->merge($merge);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'foto_profil' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }
}
