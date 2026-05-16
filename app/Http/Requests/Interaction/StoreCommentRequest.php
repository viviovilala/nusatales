<?php

namespace App\Http\Requests\Interaction;

use Illuminate\Foundation\Http\FormRequest;

class StoreCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (! $this->has('content') && $this->has('body')) {
            $this->merge([
                'content' => $this->input('body'),
            ]);
        }

        if (! $this->has('content') && $this->has('comment')) {
            $this->merge([
                'content' => $this->input('comment'),
            ]);
        }

        if (! $this->has('content') && $this->has('text')) {
            $this->merge([
                'content' => $this->input('text'),
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'content' => ['required', 'string', 'max:2000'],
        ];
    }
}
