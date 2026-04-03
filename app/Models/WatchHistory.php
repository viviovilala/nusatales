<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WatchHistory extends Model
{
    protected $table = 'watch_history';

    protected $primaryKey = 'history_id';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'video_id',
        'durasi_tonton',
        'waktu_tonton',
    ];

    protected function casts(): array
    {
        return [
            'waktu_tonton' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class, 'video_id', 'video_id');
    }
}
