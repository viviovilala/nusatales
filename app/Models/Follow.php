<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Follow extends Model
{
    protected $table = 'follows';

    protected $primaryKey = 'follow_id';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'kreator_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'kreator_id', 'user_id');
    }
}
