<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Region extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'image_path',
        'pin_x',
        'pin_y',
    ];

    protected function casts(): array
    {
        return [
            'pin_x' => 'decimal:2',
            'pin_y' => 'decimal:2',
        ];
    }

    public function videos(): HasMany
    {
        return $this->hasMany(Video::class, 'region_id');
    }

    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path ? Storage::disk('public')->url($this->image_path) : null;
    }
}
