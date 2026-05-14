<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Favorite extends Model
{
    protected $table = 'favorites';

    protected $primaryKey = 'favorite_id';

    protected $fillable = [
        'user_id',
        'favoritable_type',
        'favoritable_id',
    ];

    public function getRouteKeyName(): string
    {
        return 'favorite_id';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function favoritable(): MorphTo
    {
        return $this->morphTo();
    }
}

