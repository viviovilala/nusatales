<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ad extends Model
{
    protected $table = 'ads';

    protected $primaryKey = 'ads_id';

    public $timestamps = false;

    protected $fillable = [
        'nama_brand',
        'jenis_iklan',
        'durasi',
        'video_id',
    ];

    public function getRouteKeyName(): string
    {
        return 'ads_id';
    }

    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class, 'video_id', 'video_id');
    }
}
