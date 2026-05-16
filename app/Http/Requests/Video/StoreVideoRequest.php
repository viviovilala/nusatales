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

    protected function prepareForValidation(): void
    {
        $merge = [];

        if (! $this->has('judul') && $this->has('title')) {
            $merge['judul'] = $this->input('title');
        }

        if (! $this->has('deskripsi') && $this->has('description')) {
            $merge['deskripsi'] = $this->input('description');
        }

        if (! $this->hasFile('video_file') && $this->hasFile('video')) {
            $merge['video_file'] = $this->file('video');
        }

        if (! $this->hasFile('thumbnail_file') && $this->hasFile('thumbnail')) {
            $merge['thumbnail_file'] = $this->file('thumbnail');
        }

        if (! $this->has('kategori_id') && $this->has('category_id')) {
            $merge['kategori_id'] = $this->input('category_id');
        }

        if ($this->has('tags') && is_string($this->input('tags'))) {
            $decoded = json_decode($this->input('tags'), true);
            $merge['tags'] = is_array($decoded)
                ? $decoded
                : array_values(array_filter(array_map('trim', explode(',', $this->input('tags')))));
        }

        if ($merge !== []) {
            $this->merge($merge);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'judul' => ['required', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string'],
            'durasi' => ['nullable', 'integer', 'min:0'],
            'kategori_id' => ['nullable', 'integer', 'exists:kategori,kategori_id'],
            'cerita_id' => ['nullable', 'integer', 'exists:cerita_rakyat,cerita_id'],
            'content_type' => ['required', Rule::in(['episode', 'short'])],
            'visibility' => ['nullable', Rule::in(['public', 'unlisted', 'private'])],
            'status' => ['nullable', Rule::in(['draft', 'published', 'scheduled'])],
            'scheduled_at' => ['nullable', 'required_if:status,scheduled', 'date'],
            'is_premium' => ['nullable', 'boolean'],
            'coin_price' => ['nullable', 'integer', 'min:0'],
            'monetization_type' => ['nullable', Rule::in(['free', 'coin_unlock', 'subscription_only', 'coin_or_subscription'])],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'allow_comments' => ['nullable', 'boolean'],
            'allow_download' => ['nullable', 'boolean'],
            'genre_ids' => ['nullable', 'array'],
            'genre_ids.*' => ['integer', 'exists:genres,genre_id'],
            'region_id' => ['nullable', 'integer', 'exists:regions,id'],
            'folklore_type' => ['nullable', 'string', 'max:100'],
            'series_id' => ['nullable', 'integer', 'exists:series,series_id'],
            'episode_number' => ['nullable', 'integer', 'min:1'],
            'video_file' => ['required', 'file', 'mimetypes:video/mp4,video/quicktime,video/x-msvideo,video/webm', 'max:102400'],
            'thumbnail_file' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }
}
