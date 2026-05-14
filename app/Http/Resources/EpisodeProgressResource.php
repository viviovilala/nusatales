<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EpisodeProgressResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->progress_id,
            'episode_id' => $this->episode_id,
            'progress_seconds' => $this->progress_seconds,
            'duration_seconds' => $this->duration_seconds,
            'progress_percent' => round((float) $this->progress_percent, 2),
            'completed_at' => optional($this->completed_at)->toISOString(),
            'last_watched_at' => optional($this->last_watched_at)->toISOString(),
            'episode' => new EpisodeResource($this->whenLoaded('episode')),
        ];
    }
}

