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
            'slug' => $this->slug,
            'description' => $this->deskripsi,
            'duration' => $this->durasi,
            'content_type' => $this->content_type ?? 'episode',
            'format' => $this->format ?? (($this->content_type ?? 'episode') === 'short' ? 'short' : 'normal'),
            'visibility' => $this->visibility ?? 'public',
            'status' => $this->status,
            'rejection_reason' => $this->rejection_reason,
            'video_path' => $this->url_video,
            'video_url' => $this->video_url,
            'thumbnail_path' => $this->thumbnail,
            'thumbnail_url' => $this->thumbnail_url,
            'is_premium' => (bool) ($this->is_premium ?? false),
            'monetization_type' => $this->monetization_type ?? 'free',
            'coin_price' => (int) ($this->coin_price ?? 0),
            'allow_comments' => (bool) ($this->allow_comments ?? true),
            'allow_download' => (bool) ($this->allow_download ?? false),
            'view_count' => (int) ($this->view_count ?? $this->analytics?->views ?? 0),
            'like_count' => (int) ($this->like_count ?? $this->likes_count ?? 0),
            'comment_count' => (int) ($this->comment_count ?? $this->comments_count ?? 0),
            'tags' => $this->tags ?? [],
            'uploaded_at' => optional($this->tanggal_upload)->toISOString(),
            'published_at' => optional($this->published_at)->toISOString(),
            'scheduled_at' => optional($this->scheduled_at)->toISOString(),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'user' => new UserResource($this->whenLoaded('creator')),
            'channel' => new ChannelResource($this->whenLoaded('channel')),
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category?->kategori_id,
                'name' => $this->category?->nama_kategori,
                'slug' => $this->category?->slug,
            ]),
            'genres' => $this->whenLoaded('genres', fn () => $this->genres->map(fn ($genre) => [
                'id' => $genre->genre_id,
                'name' => $genre->name,
                'slug' => $genre->slug,
            ])->values()),
            'region' => $this->whenLoaded('region', fn () => $this->region ? [
                'id' => $this->region->id,
                'name' => $this->region->name,
                'slug' => $this->region->slug,
            ] : null),
            'series' => $this->whenLoaded('series', fn () => $this->series ? [
                'id' => $this->series->series_id,
                'title' => $this->series->title,
                'slug' => $this->series->slug,
            ] : null),
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
            'can_edit' => $request->user()?->user_id === $this->kreator_id || $request->user()?->isAdmin() === true,
            'is_liked' => $request->user()
                ? $this->likes()->where('user_id', $request->user()->user_id)->exists()
                : false,
            'is_favorited' => false,
            'can_watch' => ($this->status === 'published' && ($this->visibility ?? 'public') === 'public') || $request->user()?->user_id === $this->kreator_id || $request->user()?->isAdmin() === true,
        ];
    }
}
