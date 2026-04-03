<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
        'deskripsi',
        'durasi',
        'url_video',
        'thumbnail',
        'status',
        'rejection_reason',
        'tanggal_upload',
        'kreator_id',
        'kategori_id',
        'cerita_id',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_upload' => 'datetime',
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

    public function category(): BelongsTo
    {
        return $this->belongsTo(Kategori::class, 'kategori_id', 'kategori_id');
    }

    public function story(): BelongsTo
    {
        return $this->belongsTo(CeritaRakyat::class, 'cerita_id', 'cerita_id');
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

    public function getVideoUrlAttribute(): ?string
    {
        return $this->url_video ? Storage::disk('public')->url($this->url_video) : null;
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        return $this->thumbnail ? Storage::disk('public')->url($this->thumbnail) : null;
    }
}
