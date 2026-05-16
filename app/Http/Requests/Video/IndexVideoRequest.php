<?php

namespace App\Http\Requests\Video;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexVideoRequest extends FormRequest
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
            'search' => ['nullable', 'string', 'max:255'],
            'keyword' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(['draft', 'published', 'scheduled', 'archived', 'blocked', 'rejected'])],
            'content_type' => ['nullable', Rule::in(['episode', 'short'])],
            'kategori_id' => ['nullable', 'integer', 'exists:kategori,kategori_id'],
            'category_id' => ['nullable', 'integer', 'exists:kategori,kategori_id'],
            'genre_id' => ['nullable', 'integer', 'exists:genres,genre_id'],
            'region_id' => ['nullable', 'integer', 'exists:regions,id'],
            'kreator_id' => ['nullable', 'integer', 'exists:users,user_id'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
