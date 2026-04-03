<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Analytics extends Model
{
    protected $table = 'analytics';

    protected $primaryKey = 'analytics_id';

    public $timestamps = false;

    protected $fillable = [
        'video_id',
        'views',
        'watch_time',
        'engagement_rate',
    ];

    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class, 'video_id', 'video_id');
    }
}
