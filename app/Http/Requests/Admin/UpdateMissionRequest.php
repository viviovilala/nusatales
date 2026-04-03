<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMissionRequest extends FormRequest
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
            'judul' => ['sometimes', 'required', 'string', 'max:150'],
            'deskripsi' => ['nullable', 'string'],
            'target' => ['sometimes', 'required', 'integer', 'min:1'],
            'tipe' => ['sometimes', 'required', Rule::in(['watch', 'like', 'comment'])],
            'reward_point' => ['sometimes', 'required', 'integer', 'min:1'],
        ];
    }
}
