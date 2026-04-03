<?php

namespace Database\Seeders;

use App\Models\Kategori;
use Illuminate\Database\Seeder;

class KategoriSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $categories = [
            '2D Animation',
            '3D Animation',
            'Folklore',
            'Educational',
            'Short Film',
            'Motion Graphic',
        ];

        foreach ($categories as $category) {
            Kategori::query()->updateOrCreate(
                ['nama_kategori' => $category],
                ['nama_kategori' => $category]
            );
        }
    }
}
