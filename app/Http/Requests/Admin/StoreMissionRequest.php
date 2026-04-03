<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'judul' => ['required', 'string', 'max:150'],
            'deskripsi' => ['nullable', 'string'],
            'target' => ['required', 'integer', 'min:1'],
            'tipe' => ['required', Rule::in(['watch', 'like', 'comment'])],
            'reward_point' => ['required', 'integer', 'min:1'],
        ];
    }
}
