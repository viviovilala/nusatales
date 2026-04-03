<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CeritaRakyatResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->cerita_id,
            'title' => $this->judul_cerita,
            'region' => $this->asal_daerah,
            'description' => $this->deskripsi,
            'moral_message' => $this->pesan_moral,
            'source' => $this->sumber,
        ];
    }
}
