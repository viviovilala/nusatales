<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Rating extends Model
{
    use SoftDeletes;

    protected $table = 'ratings';

    protected $primaryKey = 'rating_id';

    protected $fillable = [
        'user_id',
        'rateable_type',
        'rateable_id',
        'score',
        'review',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'integer',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'rating_id';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function rateable(): MorphTo
    {
        return $this->morphTo();
    }
}

