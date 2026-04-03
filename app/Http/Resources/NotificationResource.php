<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->notif_id,
            'content' => $this->isi_notif,
            'status' => $this->status,
            'created_at' => optional($this->tanggal)->toISOString(),
        ];
    }
}
