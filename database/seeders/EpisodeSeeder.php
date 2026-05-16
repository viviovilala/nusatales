<?php

namespace Database\Seeders;

use App\Models\Episode;
use App\Models\Series;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class EpisodeSeeder extends Seeder
{
    /**
     * Seed demo episodes for Phase 1 catalog verification.
     */
    public function run(): void
    {
        $timunMas = Series::query()->where('slug', 'legenda-timun-mas')->first();
        $malinKundang = Series::query()->where('slug', 'malin-kundang-remastered')->first();

        if ($timunMas) {
            $this->episode($timunMas, 'A Gift From the Forest', 1, false, 0);
            $this->episode($timunMas, 'The Giant Returns', 2, true, 25);
            $this->episode($timunMas, 'Seeds of Courage', 3, false, 0);
            $this->episode($timunMas, 'The Golden Cucumber', 4, false, 0);
        }

        if ($malinKundang) {
            $this->episode($malinKundang, 'Leaving the Harbor', 1, false, 0);
            $this->episode($malinKundang, 'A Promise Forgotten', 2, false, 0);
            $this->episode($malinKundang, 'Storm Over Padang', 3, true, 20);
            $this->episode($malinKundang, 'Stone on the Shore', 4, false, 0);
        }
    }

    protected function episode(Series $series, string $title, int $number, bool $premium, int $coinPrice): void
    {
        Episode::query()->updateOrCreate(
            [
                'series_id' => $series->series_id,
                'episode_number' => $number,
            ],
            [
                'title' => $title,
                'slug' => Str::slug($title),
                'description' => "Episode {$number} of {$series->title}.",
                'duration_seconds' => 420,
                'video_path' => 'demo/episodes/sample.mp4',
                'thumbnail_path' => null,
                'is_premium' => $premium,
                'coin_price' => $coinPrice,
                'preview_seconds' => $premium ? 60 : null,
                'status' => 'published',
                'published_at' => now()->subMinutes(10 - $number),
            ]
        );
    }
}
