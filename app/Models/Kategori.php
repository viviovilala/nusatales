<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kategori extends Model
{
    protected $table = 'kategori';

    protected $primaryKey = 'kategori_id';

    public $timestamps = false;

    protected $fillable = [
        'nama_kategori',
    ];

    public function getRouteKeyName(): string
    {
        return 'kategori_id';
    }

    public function videos(): HasMany
    {
        return $this->hasMany(Video::class, 'kategori_id', 'kategori_id');
    }
}
