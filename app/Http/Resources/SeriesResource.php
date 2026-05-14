<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SeriesResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->series_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'synopsis' => $this->synopsis,
            'description' => $this->description,
            'cover_image_path' => $this->cover_image,
            'cover_image_url' => $this->cover_image_url,
            'banner_image_path' => $this->banner_image,
            'banner_image_url' => $this->banner_image_url,
            'status' => $this->status,
            'release_year' => $this->release_year,
            'age_rating' => $this->age_rating,
            'is_featured' => (bool) $this->is_featured,
            'published_at' => optional($this->published_at)->toISOString(),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'category' => new KategoriResource($this->whenLoaded('category')),
            'genres' => GenreResource::collection($this->whenLoaded('genres')),
            'episodes' => EpisodeResource::collection($this->whenLoaded('publishedEpisodes')),
            'counts' => [
                'episodes' => $this->whenCounted('publishedEpisodes', fn () => $this->published_episodes_count),
                'favorites' => $this->whenCounted('favorites', fn () => $this->favorites_count),
                'ratings' => $this->whenCounted('ratings', fn () => $this->ratings_count),
            ],
            'rating' => [
                'average' => $this->average_rating !== null ? round((float) $this->average_rating, 2) : null,
                'count' => $this->ratings_count ?? null,
            ],
        ];
    }
}

