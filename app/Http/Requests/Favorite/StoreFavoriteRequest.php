<?php

namespace App\Http\Requests\Favorite;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFavoriteRequest extends FormRequest
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
        ];
    }
}

