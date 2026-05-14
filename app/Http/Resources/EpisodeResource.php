<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EpisodeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->episode_id,
            'series_id' => $this->series_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'episode_number' => $this->episode_number,
            'duration_seconds' => $this->duration_seconds,
            'video_path' => $this->video_path,
            'video_url' => $this->video_url,
            'thumbnail_path' => $this->thumbnail_path,
            'thumbnail_url' => $this->thumbnail_url,
            'is_premium' => (bool) $this->is_premium,
            'coin_price' => (int) $this->coin_price,
            'preview_seconds' => $this->preview_seconds,
            'status' => $this->status,
            'published_at' => optional($this->published_at)->toISOString(),
            'series' => new SeriesResource($this->whenLoaded('series')),
            'counts' => [
                'favorites' => $this->whenCounted('favorites', fn () => $this->favorites_count),
                'ratings' => $this->whenCounted('ratings', fn () => $this->ratings_count),
            ],
            'rating' => [
                'average' => $this->average_rating !== null ? round((float) $this->average_rating, 2) : null,
                'count' => $this->ratings_count ?? null,
            ],
            'progress' => new EpisodeProgressResource($this->whenLoaded('viewerProgress')),
        ];
    }
}

