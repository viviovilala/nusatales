<?php

namespace App\Http\Requests\Rating;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRatingRequest extends FormRequest
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
            'target_type' => ['required', Rule::in(['series', 'episode'])],
            'target_id' => ['required', 'integer', 'min:1'],
            'score' => ['required', 'integer', 'min:1', 'max:5'],
            'review' => ['nullable', 'string', 'max:2000'],
        ];
    }
}

