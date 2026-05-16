<?php

namespace Tests\Feature;

use App\Models\Kategori;
use App\Models\User;
use App\Models\Video;
use App\Services\ChannelService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CreatorAnimationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_with_channel_can_upload_episode_animation_with_files(): void
    {
        Storage::fake('public');

        $creator = User::factory()->create(['role' => 'user']);
        app(ChannelService::class)->activateStudio($creator);
        $category = Kategori::query()->create(['nama_kategori' => 'NusaKarya']);

        Sanctum::actingAs($creator);

        $response = $this->postJson('/api/v1/creator/animations', [
            'judul' => 'Legend of Timun Mas',
            'deskripsi' => 'Animated folklore adaptation.',
            'durasi' => 180,
            'kategori_id' => $category->kategori_id,
            'content_type' => 'episode',
            'visibility' => 'public',
            'status' => 'draft',
            'video_file' => UploadedFile::fake()->create('timun-mas.mp4', 1024, 'video/mp4'),
            'thumbnail_file' => UploadedFile::fake()->image('timun-mas.jpg', 1280, 720),
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.video.title', 'Legend of Timun Mas')
            ->assertJsonPath('data.video.status', 'draft')
            ->assertJsonPath('data.video.content_type', 'episode')
            ->assertJsonStructure([
                'data' => ['video' => [
                    'id',
                    'slug',
                    'video_path',
                    'video_url',
                    'thumbnail_path',
                    'thumbnail_url',
                    'creator',
                    'channel',
                    'category',
                    'analytics',
                ]],
            ]);

        $videoPath = $response->json('data.video.video_path');
        $thumbnailPath = $response->json('data.video.thumbnail_path');

        Storage::disk('public')->assertExists($videoPath);
        Storage::disk('public')->assertExists($thumbnailPath);

        $this->assertDatabaseHas('videos', [
            'judul' => 'Legend of Timun Mas',
            'kreator_id' => $creator->user_id,
            'status' => 'draft',
        ]);
        $this->assertDatabaseHas('analytics', [
            'video_id' => $response->json('data.video.id'),
            'views' => 0,
        ]);
    }

    public function test_creator_can_filter_own_animations(): void
    {
        $creator = User::factory()->create(['role' => 'user']);
        $otherCreator = User::factory()->create(['role' => 'user']);
        $creatorChannel = app(ChannelService::class)->activateStudio($creator);
        $otherChannel = app(ChannelService::class)->activateStudio($otherCreator);

        Video::query()->create([
            'judul' => 'Published Match',
            'slug' => 'published-match',
            'deskripsi' => 'Searchable story',
            'durasi' => 60,
            'url_video' => 'videos/published.mp4',
            'video_path' => 'videos/published.mp4',
            'status' => 'published',
            'visibility' => 'public',
            'content_type' => 'episode',
            'format' => 'normal',
            'tanggal_upload' => now(),
            'kreator_id' => $creator->user_id,
            'channel_id' => $creatorChannel->id,
        ]);

        Video::query()->create([
            'judul' => 'Other Creator Match',
            'slug' => 'other-creator-match',
            'deskripsi' => 'Searchable story',
            'durasi' => 60,
            'url_video' => 'videos/other.mp4',
            'video_path' => 'videos/other.mp4',
            'status' => 'published',
            'visibility' => 'public',
            'content_type' => 'episode',
            'format' => 'normal',
            'tanggal_upload' => now(),
            'kreator_id' => $otherCreator->user_id,
            'channel_id' => $otherChannel->id,
        ]);

        Sanctum::actingAs($creator);

        $this->getJson('/api/v1/creator/animations?status=published&search=Match')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Published Match');
    }

    public function test_guest_cannot_access_creator_animation_routes(): void
    {
        $this->getJson('/api/v1/creator/animations')
            ->assertUnauthorized()
            ->assertJsonPath('success', false)
            ->assertJsonMissingPath('trace');
    }

    public function test_logged_in_user_without_channel_can_open_empty_creator_index(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'user']));

        $this->getJson('/api/v1/creator/animations')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(0, 'data');
    }
}
