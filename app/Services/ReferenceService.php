<?php

namespace App\Services;

use App\Models\CeritaRakyat;
use App\Models\Kategori;
use Illuminate\Database\Eloquent\Collection;

class ReferenceService
{
    public function categories(): Collection
    {
        return Kategori::query()
            ->orderBy('nama_kategori')
            ->get();
    }

    public function stories(?string $search = null): Collection
    {
        return CeritaRakyat::query()
            ->when($search, function ($query) use ($search) {
                $query->where(function ($builder) use ($search) {
                    $builder
                        ->where('judul_cerita', 'like', "%{$search}%")
                        ->orWhere('asal_daerah', 'like', "%{$search}%");
                });
            })
            ->orderBy('judul_cerita')
            ->get();
    }
}
