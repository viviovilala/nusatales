<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserMissionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->user_mission_id,
            'progress' => $this->progress,
            'status' => $this->status,
            'date' => optional($this->tanggal)->toDateString(),
            'mission' => $this->whenLoaded('mission', fn () => [
                'id' => $this->mission?->mission_id,
                'title' => $this->mission?->judul,
                'description' => $this->mission?->deskripsi,
                'type' => $this->mission?->tipe,
                'target' => $this->mission?->target,
                'reward_point' => $this->mission?->reward_point,
            ]),
        ];
    }
}
