<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPoint extends Model
{
    protected $table = 'user_points';

    protected $primaryKey = 'point_id';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'total_point',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
