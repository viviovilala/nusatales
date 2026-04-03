<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DailyMission extends Model
{
    protected $table = 'daily_missions';

    protected $primaryKey = 'mission_id';

    public $timestamps = false;

    protected $fillable = [
        'judul',
        'deskripsi',
        'target',
        'tipe',
        'reward_point',
    ];

    public function getRouteKeyName(): string
    {
        return 'mission_id';
    }

    public function userMissions(): HasMany
    {
        return $this->hasMany(UserMission::class, 'mission_id', 'mission_id');
    }
}
