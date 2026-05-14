<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EpisodeProgress extends Model
{
    protected $table = 'episode_progress';

    protected $primaryKey = 'progress_id';

    protected $fillable = [
        'user_id',
        'episode_id',
        'progress_seconds',
        'duration_seconds',
        'progress_percent',
        'completed_at',
        'last_watched_at',
    ];

    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
            'last_watched_at' => 'datetime',
            'progress_percent' => 'float',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function episode(): BelongsTo
    {
        return $this->belongsTo(Episode::class, 'episode_id', 'episode_id');
    }
}

