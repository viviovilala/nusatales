<?php

namespace Database\Seeders;

use App\Models\Genre;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class GenreSeeder extends Seeder
{
    /**
     * Seed catalog genres used by the Phase 1 series experience.
     */
    public function run(): void
    {
        $genres = [
            ['name' => 'Adventure', 'description' => 'Journey-driven folklore and heroic quests.'],
            ['name' => 'Mythology', 'description' => 'Stories rooted in myths, spirits, and legendary figures.'],
            ['name' => 'Comedy', 'description' => 'Light folklore adaptations for family viewing.'],
            ['name' => 'Drama', 'description' => 'Character-led cultural stories with emotional stakes.'],
            ['name' => 'Education', 'description' => 'Episodes focused on values, history, and cultural literacy.'],
            ['name' => 'Historical', 'description' => 'Kingdoms, monuments, and historically inspired legends.'],
        ];

        foreach ($genres as $genre) {
            Genre::query()->updateOrCreate(
                ['slug' => Str::slug($genre['name'])],
                [
                    'name' => $genre['name'],
                    'description' => $genre['description'],
                    'status' => 'active',
                ]
            );
        }
    }
}
