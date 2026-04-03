<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->user_id,
            'name' => $this->nama,
            'email' => $this->email,
            'role' => $this->role,
            'profile_photo' => $this->foto_profil ? Storage::disk('public')->url($this->foto_profil) : null,
            'joined_at' => optional($this->tanggal_daftar)->toISOString(),
        ];
    }
}
