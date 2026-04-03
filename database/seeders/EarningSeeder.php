<?php

namespace Database\Seeders;

use App\Models\Earning;
use App\Models\User;
use App\Models\Video;
use Illuminate\Database\Seeder;

class EarningSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $creator = User::query()->where('role', 'kreator')->first();
        $video = Video::query()->first();

        if (! $creator || ! $video) {
            return;
        }

        Earning::query()->updateOrCreate(
            [
                'kreator_id' => $creator->user_id,
                'video_id' => $video->video_id,
                'tanggal' => now()->toDateString(),
            ],
            [
                'jumlah_pendapatan' => 150000,
            ]
        );
    }
}
