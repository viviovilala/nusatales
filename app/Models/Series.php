<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Series extends Model
{
    use SoftDeletes;

    protected $table = 'series';

    protected $primaryKey = 'series_id';

    protected $fillable = [
        'creator_id',
        'kategori_id',
        'title',
        'slug',
        'synopsis',
        'description',
        'cover_image',
        'banner_image',
        'status',
        'release_year',
        'age_rating',
        'is_featured',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'is_featured' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id', 'user_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Kategori::class, 'kategori_id', 'kategori_id');
    }

    public function genres(): BelongsToMany
    {
        return $this->belongsToMany(Genre::class, 'genre_series', 'series_id', 'genre_id');
    }

    public function episodes(): HasMany
    {
        return $this->hasMany(Episode::class, 'series_id', 'series_id');
    }

    public function publishedEpisodes(): HasMany
    {
        return $this->episodes()
            ->where('status', 'published')
            ->orderBy('episode_number');
    }

    public function favorites(): MorphMany
    {
        return $this->morphMany(Favorite::class, 'favoritable');
    }

    public function ratings(): MorphMany
    {
        return $this->morphMany(Rating::class, 'rateable');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published');
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (! $term) {
            return $query;
        }

        return $query->where(function (Builder $builder) use ($term) {
            $builder
                ->where('title', 'like', "%{$term}%")
                ->orWhere('synopsis', 'like', "%{$term}%")
                ->orWhere('description', 'like', "%{$term}%");
        });
    }

    public function getCoverImageUrlAttribute(): ?string
    {
        return $this->cover_image ? Storage::disk('public')->url($this->cover_image) : null;
    }

    public function getBannerImageUrlAttribute(): ?string
    {
        return $this->banner_image ? Storage::disk('public')->url($this->banner_image) : null;
    }
}

