<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Earning extends Model
{
    protected $table = 'earnings';

    protected $primaryKey = 'earning_id';

    public $timestamps = false;

    protected $fillable = [
        'kreator_id',
        'video_id',
        'jumlah_pendapatan',
        'tanggal',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'jumlah_pendapatan' => 'decimal:2',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'kreator_id', 'user_id');
    }

    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class, 'video_id', 'video_id');
    }
}
