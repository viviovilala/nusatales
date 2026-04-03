<?php

namespace App\Http\Requests\Video;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreVideoRequest extends FormRequest
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
            'judul' => ['required', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string'],
            'durasi' => ['required', 'integer', 'min:1'],
            'kategori_id' => ['nullable', 'integer', 'exists:kategori,kategori_id'],
            'cerita_id' => ['nullable', 'integer', 'exists:cerita_rakyat,cerita_id'],
            'status' => ['nullable', Rule::in(['draft', 'published'])],
            'video_file' => ['required', 'file', 'mimetypes:video/mp4,video/quicktime,video/x-msvideo,video/webm', 'max:102400'],
            'thumbnail_file' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }
}
