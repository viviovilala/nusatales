<?php

namespace App\Http\Requests\Episode;

use Illuminate\Foundation\Http\FormRequest;

class StoreEpisodeProgressRequest extends FormRequest
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
            'progress_seconds' => ['required', 'integer', 'min:0'],
            'duration_seconds' => ['nullable', 'integer', 'min:0'],
            'completed' => ['nullable', 'boolean'],
        ];
    }
}

