<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NusaKoinTransaction extends Model
{
    protected $table = 'nusa_koin_transactions';

    protected $primaryKey = 'transaction_id';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'type',
        'amount',
        'source',
        'notes',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
