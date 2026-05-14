<?php

namespace App\Http\Resources;

use App\Models\Episode;
use App\Models\Series;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RatingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->rating_id,
            'target_type' => match ($this->rateable_type) {
                Series::class => 'series',
                Episode::class => 'episode',
                default => 'unknown',
            },
            'target_id' => $this->rateable_id,
            'score' => $this->score,
            'review' => $this->review,
            'status' => $this->status,
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}

