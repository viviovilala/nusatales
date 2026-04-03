<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserMission extends Model
{
    protected $table = 'user_missions';

    protected $primaryKey = 'user_mission_id';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'mission_id',
        'progress',
        'status',
        'tanggal',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function mission(): BelongsTo
    {
        return $this->belongsTo(DailyMission::class, 'mission_id', 'mission_id');
    }
}
