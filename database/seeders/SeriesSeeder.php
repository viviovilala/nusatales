<?php

namespace Database\Seeders;

use App\Models\Genre;
use App\Models\Kategori;
use App\Models\Series;
use App\Models\User;
use Illuminate\Database\Seeder;

class SeriesSeeder extends Seeder
{
    /**
     * Seed demo series for the Phase 1 catalog.
     */
    public function run(): void
    {
        $creator = User::query()->where('email', 'creator@nusatales.test')->first()
            ?? User::query()->where('role', 'creator')->first();
        $category = Kategori::query()->where('slug', 'folklore')->first()
            ?? Kategori::query()->first();

        if (! $creator || ! $category) {
            return;
        }

        $series = Series::query()->updateOrCreate(
            ['slug' => 'legenda-timun-mas'],
            [
                'creator_id' => $creator->user_id,
                'kategori_id' => $category->kategori_id,
                'title' => 'Legenda Timun Mas',
                'synopsis' => 'A brave child faces a giant through wit, courage, and gifts from the forest.',
                'description' => 'A short-form animated adaptation of the Central Java folktale for family audiences.',
                'cover_image' => null,
                'banner_image' => null,
                'status' => 'published',
                'release_year' => 2026,
                'age_rating' => 'SU',
                'is_featured' => true,
                'published_at' => now(),
            ]
        );

        $genreIds = Genre::query()
            ->whereIn('slug', ['adventure', 'mythology', 'education'])
            ->pluck('genre_id')
            ->all();

        if ($genreIds !== []) {
            $series->genres()->sync($genreIds);
        }

        Series::query()->updateOrCreate(
            ['slug' => 'malin-kundang-remastered'],
            [
                'creator_id' => $creator->user_id,
                'kategori_id' => $category->kategori_id,
                'title' => 'Malin Kundang Remastered',
                'synopsis' => 'A modern animated retelling about pride, family, and consequence.',
                'description' => 'A Minangkabau legend adapted into short episodes for mobile-first viewing.',
                'cover_image' => null,
                'banner_image' => null,
                'status' => 'published',
                'release_year' => 2026,
                'age_rating' => 'SU',
                'is_featured' => false,
                'published_at' => now()->subDay(),
            ]
        )->genres()->sync(
            Genre::query()
                ->whereIn('slug', ['drama', 'education'])
                ->pluck('genre_id')
                ->all()
        );
    }
}
