<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreAdRequest extends FormRequest
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
            'nama_brand' => ['required', 'string', 'max:255'],
            'jenis_iklan' => ['required', 'string', 'max:255'],
            'durasi' => ['required', 'integer', 'min:1'],
            'video_id' => ['nullable', 'integer', 'exists:videos,video_id'],
        ];
    }
}
