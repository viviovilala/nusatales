<?php

namespace Database\Seeders;

use App\Models\DailyMission;
use Illuminate\Database\Seeder;

class DailyMissionSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $missions = [
            [
                'judul' => 'Watch 3 animations',
                'deskripsi' => 'Watch three published animations today.',
                'target' => 3,
                'tipe' => 'watch',
                'reward_point' => 15,
            ],
            [
                'judul' => 'Like 2 animations',
                'deskripsi' => 'Give likes to two animations.',
                'target' => 2,
                'tipe' => 'like',
                'reward_point' => 10,
            ],
            [
                'judul' => 'Leave 1 comment',
                'deskripsi' => 'Comment on one animation today.',
                'target' => 1,
                'tipe' => 'comment',
                'reward_point' => 12,
            ],
        ];

        foreach ($missions as $mission) {
            DailyMission::query()->updateOrCreate(
                ['judul' => $mission['judul']],
                $mission
            );
        }
    }
}
