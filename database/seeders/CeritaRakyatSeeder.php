<?php

namespace Database\Seeders;

use App\Models\CeritaRakyat;
use Illuminate\Database\Seeder;

class CeritaRakyatSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $stories = [
            [
                'judul_cerita' => 'Malin Kundang',
                'asal_daerah' => 'West Sumatra',
                'deskripsi' => 'A classic story about filial piety and consequences.',
                'pesan_moral' => 'Respect your parents and stay humble.',
                'sumber' => 'Internal curated dataset',
            ],
            [
                'judul_cerita' => 'Timun Mas',
                'asal_daerah' => 'Central Java',
                'deskripsi' => 'A heroic tale of courage and escape from danger.',
                'pesan_moral' => 'Bravery and wisdom can overcome fear.',
                'sumber' => 'Internal curated dataset',
            ],
            [
                'judul_cerita' => 'Sangkuriang',
                'asal_daerah' => 'West Java',
                'deskripsi' => 'A legendary origin story tied to mountains and destiny.',
                'pesan_moral' => 'Patience and truth matter in difficult situations.',
                'sumber' => 'Internal curated dataset',
            ],
        ];

        foreach ($stories as $story) {
            CeritaRakyat::query()->updateOrCreate(
                [
                    'judul_cerita' => $story['judul_cerita'],
                    'asal_daerah' => $story['asal_daerah'],
                ],
                $story
            );
        }
    }
}
