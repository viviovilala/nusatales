<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->comment_id,
            'video_id' => $this->video_id,
            'parent_id' => $this->parent_id,
            'content' => $this->body ?: $this->isi_komentar,
            'body' => $this->body ?: $this->isi_komentar,
            'status' => $this->status ?? 'published',
            'created_at' => optional($this->created_at ?: $this->tanggal)->toISOString(),
            'is_admin_reply' => $this->user?->role === 'admin',
            'user' => new UserResource($this->whenLoaded('user')),
            'replies' => CommentResource::collection($this->whenLoaded('replies')),
        ];
    }
}
