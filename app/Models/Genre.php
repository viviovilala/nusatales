<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Genre extends Model
{
    use SoftDeletes;

    protected $table = 'genres';

    protected $primaryKey = 'genre_id';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'status',
    ];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function series(): BelongsToMany
    {
        return $this->belongsToMany(Series::class, 'genre_series', 'genre_id', 'series_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }
}

