<?php

namespace Tests\Feature;

use App\Models\Episode;
use App\Models\Kategori;
use App\Models\Series;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PhaseOneAuthenticatedFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_protected_phase_one_features(): void
    {
        $episode = $this->publishedEpisode();

        $this->getJson('/api/v1/favorites')->assertUnauthorized();

        $this->postJson('/api/v1/favorites', [
            'target_type' => 'series',
            'target_id' => $episode->series_id,
        ])->assertUnauthorized();

        $this->postJson('/api/v1/ratings', [
            'target_type' => 'series',
            'target_id' => $episode->series_id,
            'score' => 5,
        ])->assertUnauthorized();

        $this->postJson("/api/v1/episodes/{$episode->episode_id}/progress", [
            'progress_seconds' => 120,
            'duration_seconds' => 420,
        ])->assertUnauthorized();
    }

    public function test_authenticated_user_can_save_favorite_rating_and_watch_progress(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $episode = $this->publishedEpisode();

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/favorites', [
            'target_type' => 'series',
            'target_id' => $episode->series_id,
            ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.target_type', 'series');

        $this->postJson('/api/v1/ratings', [
            'target_type' => 'episode',
            'target_id' => $episode->episode_id,
            'score' => 5,
            'review' => 'Great family folklore adaptation.',
        ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.score', 5);

        $this->postJson("/api/v1/episodes/{$episode->episode_id}/progress", [
            'progress_seconds' => 210,
            'duration_seconds' => 420,
        ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.progress_seconds', 210)
            ->assertJsonPath('data.progress_percent', 50);

        $this->assertDatabaseHas('favorites', [
            'user_id' => $user->user_id,
            'favoritable_id' => $episode->series_id,
        ]);

        $this->assertDatabaseHas('ratings', [
            'user_id' => $user->user_id,
            'rateable_id' => $episode->episode_id,
            'score' => 5,
        ]);

        $this->assertDatabaseHas('episode_progress', [
            'user_id' => $user->user_id,
            'episode_id' => $episode->episode_id,
            'progress_seconds' => 210,
        ]);
    }

    protected function publishedEpisode(): Episode
    {
        $creator = User::factory()->create(['role' => 'user']);
        $category = Kategori::query()->create([
            'nama_kategori' => 'Folklore',
            'slug' => 'folklore',
            'description' => 'Folklore content.',
            'status' => 'active',
        ]);

        $series = Series::query()->create([
            'creator_id' => $creator->user_id,
            'kategori_id' => $category->kategori_id,
            'title' => 'Legenda Test',
            'slug' => 'legenda-test',
            'synopsis' => 'A test series.',
            'description' => 'A test series.',
            'status' => 'published',
            'release_year' => 2026,
            'age_rating' => 'SU',
            'is_featured' => true,
            'published_at' => now(),
        ]);

        return Episode::query()->create([
            'series_id' => $series->series_id,
            'title' => 'Episode Test',
            'slug' => 'episode-test',
            'description' => 'A test episode.',
            'episode_number' => 1,
            'duration_seconds' => 420,
            'video_path' => 'videos/test.mp4',
            'thumbnail_path' => null,
            'is_premium' => false,
            'coin_price' => 0,
            'preview_seconds' => null,
            'status' => 'published',
            'published_at' => now(),
        ]);
    }
}
