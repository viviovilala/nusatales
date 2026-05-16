<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Channel extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'subtitle',
        'description',
        'avatar_path',
        'banner_path',
        'avatar',
        'banner',
        'location',
        'social_links',
        'status',
        'is_verified',
        'subscriber_count',
        'video_count',
        'total_views',
        'monetization_status',
        'monetization_enabled_at',
        'monetization_agreed_at',
        'platform_fee_percentage',
        'creator_share_percentage',
    ];

    protected function casts(): array
    {
        return [
            'social_links' => 'array',
            'is_verified' => 'boolean',
            'subscriber_count' => 'integer',
            'video_count' => 'integer',
            'total_views' => 'integer',
            'monetization_enabled_at' => 'datetime',
            'monetization_agreed_at' => 'datetime',
            'platform_fee_percentage' => 'decimal:2',
            'creator_share_percentage' => 'decimal:2',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function videos(): HasMany
    {
        return $this->hasMany(Video::class, 'channel_id');
    }

    public function series(): HasMany
    {
        return $this->hasMany(Series::class, 'channel_id');
    }

    public function getAvatarUrlAttribute(): ?string
    {
        $path = $this->avatar ?: $this->avatar_path;

        return $path ? Storage::disk('public')->url($path) : null;
    }

    public function getBannerUrlAttribute(): ?string
    {
        $path = $this->banner ?: $this->banner_path;

        return $path ? Storage::disk('public')->url($path) : null;
    }
}
