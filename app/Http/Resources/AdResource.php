<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->ads_id,
            'brand_name' => $this->nama_brand,
            'ad_type' => $this->jenis_iklan,
            'duration' => $this->durasi,
            'video' => $this->whenLoaded('video', fn () => [
                'id' => $this->video?->video_id,
                'title' => $this->video?->judul,
            ]),
        ];
    }
}
