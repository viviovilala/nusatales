<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VideoResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->video_id,
            'title' => $this->judul,
            'description' => $this->deskripsi,
            'duration' => $this->durasi,
            'status' => $this->status,
            'rejection_reason' => $this->rejection_reason,
            'video_path' => $this->url_video,
            'video_url' => $this->video_url,
            'thumbnail_path' => $this->thumbnail,
            'thumbnail_url' => $this->thumbnail_url,
            'uploaded_at' => optional($this->tanggal_upload)->toISOString(),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category?->kategori_id,
                'name' => $this->category?->nama_kategori,
            ]),
            'story' => $this->whenLoaded('story', fn () => [
                'id' => $this->story?->cerita_id,
                'title' => $this->story?->judul_cerita,
                'region' => $this->story?->asal_daerah,
            ]),
            'analytics' => $this->whenLoaded('analytics', fn () => [
                'views' => $this->analytics?->views ?? 0,
                'watch_time' => $this->analytics?->watch_time ?? 0,
                'engagement_rate' => $this->analytics?->engagement_rate ?? 0,
            ]),
            'counts' => [
                'likes' => $this->whenCounted('likes', fn () => $this->likes_count),
                'comments' => $this->whenCounted('comments', fn () => $this->comments_count),
                'shares' => $this->whenCounted('shares', fn () => $this->shares_count),
            ],
        ];
    }
}
