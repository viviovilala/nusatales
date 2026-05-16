<?php

namespace App\Http\Resources;

use App\Models\Episode;
use App\Models\Series;
use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FavoriteResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $target = $this->whenLoaded('favoritable');

        return [
            'id' => $this->favorite_id,
            'target_type' => $this->targetType(),
            'target_id' => $this->favoritable_id,
            'created_at' => optional($this->created_at)->toISOString(),
            'target' => $target instanceof Series
                ? new SeriesResource($target)
                : ($target instanceof Episode
                    ? new EpisodeResource($target)
                    : ($target instanceof Video ? new VideoResource($target) : null)),
        ];
    }

    protected function targetType(): string
    {
        return match ($this->favoritable_type) {
            Series::class => 'series',
            Episode::class => 'episode',
            Video::class => 'video',
            default => 'unknown',
        };
    }
}
