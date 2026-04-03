<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EarningResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->earning_id,
            'amount' => (float) $this->jumlah_pendapatan,
            'date' => optional($this->tanggal)->toDateString(),
            'video' => $this->whenLoaded('video', fn () => [
                'id' => $this->video?->video_id,
                'title' => $this->video?->judul,
            ]),
        ];
    }
}
