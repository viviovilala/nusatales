<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Episode extends Model
{
    use SoftDeletes;

    protected $table = 'episodes';

    protected $primaryKey = 'episode_id';

    protected $fillable = [
        'series_id',
        'title',
        'slug',
        'description',
        'episode_number',
        'duration_seconds',
        'video_path',
        'thumbnail_path',
        'is_premium',
        'coin_price',
        'preview_seconds',
        'status',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'is_premium' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'episode_id';
    }

    public function series(): BelongsTo
    {
        return $this->belongsTo(Series::class, 'series_id', 'series_id');
    }

    public function favorites(): MorphMany
    {
        return $this->morphMany(Favorite::class, 'favoritable');
    }

    public function ratings(): MorphMany
    {
        return $this->morphMany(Rating::class, 'rateable');
    }

    public function progress(): HasMany
    {
        return $this->hasMany(EpisodeProgress::class, 'episode_id', 'episode_id');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published');
    }

    public function getVideoUrlAttribute(): ?string
    {
        return $this->video_path ? Storage::disk('public')->url($this->video_path) : null;
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        return $this->thumbnail_path ? Storage::disk('public')->url($this->thumbnail_path) : null;
    }
}

