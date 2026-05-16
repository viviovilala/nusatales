<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChannelResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'subtitle' => $this->subtitle,
            'description' => $this->description,
            'avatar_url' => $this->avatar_url,
            'banner_url' => $this->banner_url,
            'location' => $this->location,
            'social_links' => $this->social_links ?? [],
            'status' => $this->status,
            'is_verified' => (bool) $this->is_verified,
            'subscriber_count' => (int) ($this->subscriber_count ?? 0),
            'video_count' => (int) ($this->video_count ?? 0),
            'total_views' => (int) ($this->total_views ?? 0),
            'monetization_status' => $this->monetization_status ?? 'inactive',
            'can_monetize' => $this->monetization_status === 'active',
            'created_at' => optional($this->created_at)->toISOString(),
        ];
    }
}
