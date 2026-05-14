<?php

namespace App\Http\Requests\Series;

use Illuminate\Foundation\Http\FormRequest;

class IndexSeriesRequest extends FormRequest
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
            'genre' => ['nullable', 'string', 'max:255'],
            'genre_id' => ['nullable', 'integer', 'exists:genres,genre_id'],
            'kategori_id' => ['nullable', 'integer', 'exists:kategori,kategori_id'],
            'creator_id' => ['nullable', 'integer', 'exists:users,user_id'],
            'featured' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}

