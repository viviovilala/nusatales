<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Storage;

class Video extends Model
{
    protected $table = 'videos';

    protected $primaryKey = 'video_id';

    public $timestamps = false;

    protected $fillable = [
        'judul',
        'slug',
        'deskripsi',
        'durasi',
        'url_video',
        'video_path',
        'video_url',
        'thumbnail',
        'thumbnail_path',
        'status',
        'rejection_reason',
        'visibility',
        'scheduled_at',
        'published_at',
        'is_premium',
        'monetization_type',
        'coin_price',
        'is_monetized',
        'monetization_status',
        'allow_comments',
        'allow_download',
        'view_count',
        'like_count',
        'comment_count',
        'tanggal_upload',
        'kreator_id',
        'channel_id',
        'content_type',
        'format',
        'kategori_id',
        'cerita_id',
        'series_id',
        'episode_number',
        'region_id',
        'folklore_type',
        'tags',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_upload' => 'datetime',
            'scheduled_at' => 'datetime',
            'published_at' => 'datetime',
            'is_premium' => 'boolean',
            'is_monetized' => 'boolean',
            'allow_comments' => 'boolean',
            'allow_download' => 'boolean',
            'view_count' => 'integer',
            'like_count' => 'integer',
            'comment_count' => 'integer',
            'coin_price' => 'integer',
            'tags' => 'array',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'video_id';
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'kreator_id', 'user_id');
    }

    public function user(): BelongsTo
    {
        return $this->creator();
    }

    public function channel(): BelongsTo
    {
        return $this->belongsTo(Channel::class, 'channel_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Kategori::class, 'kategori_id', 'kategori_id');
    }

    public function story(): BelongsTo
    {
        return $this->belongsTo(CeritaRakyat::class, 'cerita_id', 'cerita_id');
    }

    public function series(): BelongsTo
    {
        return $this->belongsTo(Series::class, 'series_id', 'series_id');
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class, 'region_id');
    }

    public function genres(): BelongsToMany
    {
        return $this->belongsToMany(Genre::class, 'video_genre', 'video_id', 'genre_id', 'video_id', 'genre_id');
    }

    public function analytics(): HasOne
    {
        return $this->hasOne(Analytics::class, 'video_id', 'video_id');
    }

    public function likes(): HasMany
    {
        return $this->hasMany(Like::class, 'video_id', 'video_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class, 'video_id', 'video_id');
    }

    public function shares(): HasMany
    {
        return $this->hasMany(Share::class, 'video_id', 'video_id');
    }

    public function earnings(): HasMany
    {
        return $this->hasMany(Earning::class, 'video_id', 'video_id');
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (! $term) {
            return $query;
        }

        return $query->where(function (Builder $builder) use ($term) {
            $builder
                ->where('judul', 'like', "%{$term}%")
                ->orWhere('deskripsi', 'like', "%{$term}%");
        });
    }

    public function scopeFilterStatus(Builder $query, ?string $status): Builder
    {
        return $status ? $query->where('status', $status) : $query;
    }

    public function scopeFilterCategory(Builder $query, ?int $categoryId): Builder
    {
        return $categoryId ? $query->where('kategori_id', $categoryId) : $query;
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published');
    }

    public function scopeShorts(Builder $query): Builder
    {
        return $query->where('content_type', 'short');
    }

    public function scopeEpisodes(Builder $query): Builder
    {
        return $query->where('content_type', 'episode');
    }

    public function scopePubliclyVisible(Builder $query): Builder
    {
        return $query->where('visibility', 'public');
    }

    public function scopeVisibleToUser(Builder $query, ?User $user): Builder
    {
        if ($user?->isAdmin()) {
            return $query;
        }

        return $query->where(function (Builder $builder) use ($user) {
            $builder->published()->publiclyVisible();

            if ($user) {
                $builder->orWhere('kreator_id', $user->user_id);
            }
        });
    }

    public function getSlugAttribute(?string $value): string
    {
        return $value ?: (string) $this->video_id;
    }

    public function getVideoUrlAttribute(): ?string
    {
        $path = $this->video_path ?: $this->url_video;
        $externalUrl = $this->attributes['video_url'] ?? null;

        if ($externalUrl) {
            return $externalUrl;
        }

        return $path ? Storage::disk('public')->url($path) : null;
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        $path = $this->thumbnail_path ?: $this->thumbnail;

        return $path ? Storage::disk('public')->url($path) : '/assets/nusatales/fallback-thumbnail.svg';
    }
}
