<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CeritaRakyat extends Model
{
    protected $table = 'cerita_rakyat';

    protected $primaryKey = 'cerita_id';

    public $timestamps = false;

    protected $fillable = [
        'judul_cerita',
        'asal_daerah',
        'deskripsi',
        'pesan_moral',
        'sumber',
        'lokasi_id',
    ];

    public function getRouteKeyName(): string
    {
        return 'cerita_id';
    }

    public function videos(): HasMany
    {
        return $this->hasMany(Video::class, 'cerita_id', 'cerita_id');
    }
}
