<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            DemoAccountSeeder::class,
            KategoriSeeder::class,
            GenreSeeder::class,
            CeritaRakyatSeeder::class,
            SeriesSeeder::class,
            EpisodeSeeder::class,
            DailyMissionSeeder::class,
            SubscriptionPlanSeeder::class,
            UserPointSeeder::class,
            EarningSeeder::class,
        ]);
    }
}
