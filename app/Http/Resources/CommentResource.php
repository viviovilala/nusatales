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
            'content' => $this->isi_komentar,
            'created_at' => optional($this->tanggal)->toISOString(),
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
