<?php

namespace Database\Seeders;

use App\Models\Kategori;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class KategoriSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $categories = [
            ['name' => '2D Animation', 'description' => 'Frame-by-frame and cutout animated shorts.'],
            ['name' => '3D Animation', 'description' => 'Three-dimensional animation and stylized CG stories.'],
            ['name' => 'Folklore', 'description' => 'Indonesian legends, myths, and local oral traditions.'],
            ['name' => 'Educational', 'description' => 'Cultural literacy, history, and values for younger viewers.'],
            ['name' => 'Short Film', 'description' => 'Standalone animated shorts and festival-style stories.'],
            ['name' => 'Motion Graphic', 'description' => 'Motion design and explainer-style cultural content.'],
        ];

        foreach ($categories as $category) {
            Kategori::query()->updateOrCreate(
                ['nama_kategori' => $category['name']],
                [
                    'nama_kategori' => $category['name'],
                    'slug' => Str::slug($category['name']),
                    'description' => $category['description'],
                    'status' => 'active',
                ]
            );
        }
    }
}
