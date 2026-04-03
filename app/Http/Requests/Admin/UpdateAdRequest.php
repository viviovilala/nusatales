<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAdRequest extends FormRequest
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
            'nama_brand' => ['sometimes', 'required', 'string', 'max:255'],
            'jenis_iklan' => ['sometimes', 'required', 'string', 'max:255'],
            'durasi' => ['sometimes', 'required', 'integer', 'min:1'],
            'video_id' => ['nullable', 'integer', 'exists:videos,video_id'],
        ];
    }
}
