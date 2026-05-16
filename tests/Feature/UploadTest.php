<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_logged_in_user_without_channel_uploads_episode_and_gets_channel(): void
    {
        Storage::fake('public');

        $user = User::factory()->create(['role' => 'user']);
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/creator/animations', [
            'title' => 'Episode Roro Jonggrang',
            'description' => 'Episode panjang NusaSaga.',
            'content_type' => 'episode',
            'visibility' => 'public',
            'status' => 'published',
            'video' => UploadedFile::fake()->create('roro.mp4', 1024, 'video/mp4'),
            'thumbnail' => UploadedFile::fake()->image('roro.jpg', 1280, 720),
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Video berhasil diunggah.')
            ->assertJsonPath('data.video.content_type', 'episode')
            ->assertJsonPath('data.video.format', 'normal')
            ->assertJsonPath('data.video.status', 'published')
            ->assertJsonPath('data.video.slug', 'episode-roro-jonggrang');

        $this->assertDatabaseHas('channels', ['user_id' => $user->user_id]);
        $this->assertDatabaseHas('videos', [
            'slug' => 'episode-roro-jonggrang',
            'content_type' => 'episode',
            'format' => 'normal',
            'kreator_id' => $user->user_id,
        ]);

        Storage::disk('public')->assertExists($response->json('data.video.video_path'));
    }

    public function test_logged_in_user_can_upload_short(): void
    {
        Storage::fake('public');

        $user = User::factory()->create(['role' => 'user']);
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/creator/animations', [
            'title' => 'Cuplikan Wayang Cepat',
            'description' => 'Short untuk Lakon.',
            'content_type' => 'short',
            'visibility' => 'public',
            'status' => 'published',
            'video' => UploadedFile::fake()->create('short.webm', 1024, 'video/webm'),
        ])
            ->assertCreated()
            ->assertJsonPath('data.video.content_type', 'short')
            ->assertJsonPath('data.video.format', 'short');

        $this->assertDatabaseHas('videos', [
            'slug' => 'cuplikan-wayang-cepat',
            'content_type' => 'short',
            'format' => 'short',
            'is_premium' => false,
        ]);
    }

    public function test_premium_upload_requires_monetization_agreement(): void
    {
        Storage::fake('public');

        $user = User::factory()->create(['role' => 'user']);
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/creator/animations', [
            'title' => 'Premium Saga',
            'content_type' => 'episode',
            'visibility' => 'public',
            'status' => 'published',
            'is_premium' => true,
            'coin_price' => 25,
            'video' => UploadedFile::fake()->create('premium.mp4', 1024, 'video/mp4'),
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['monetization']);

        $this->postJson('/api/v1/creator/monetization/agree', [
            'agreed' => true,
        ])->assertOk();

        $this->postJson('/api/v1/creator/animations', [
            'title' => 'Premium Saga',
            'content_type' => 'episode',
            'visibility' => 'public',
            'status' => 'published',
            'is_premium' => true,
            'coin_price' => 25,
            'video' => UploadedFile::fake()->create('premium.mp4', 1024, 'video/mp4'),
        ])
            ->assertCreated()
            ->assertJsonPath('data.video.is_premium', true)
            ->assertJsonPath('data.video.coin_price', 25);
    }
}
