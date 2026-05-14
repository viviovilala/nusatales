<?php

namespace Tests\Feature;

use App\Models\Kategori;
use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CreatorAnimationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_creator_can_upload_animation_with_files(): void
    {
        Storage::fake('public');

        $creator = User::factory()->create(['role' => 'creator']);
        $category = Kategori::query()->create(['nama_kategori' => 'NusaKarya']);

        Sanctum::actingAs($creator);

        $response = $this->postJson('/api/v1/creator/animations', [
            'judul' => 'Legend of Timun Mas',
            'deskripsi' => 'Animated folklore adaptation.',
            'durasi' => 180,
            'kategori_id' => $category->kategori_id,
            'status' => 'draft',
            'video_file' => UploadedFile::fake()->create('timun-mas.mp4', 1024, 'video/mp4'),
            'thumbnail_file' => UploadedFile::fake()->image('timun-mas.jpg', 1280, 720),
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Legend of Timun Mas')
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'video_path',
                    'video_url',
                    'thumbnail_path',
                    'thumbnail_url',
                    'creator',
                    'category',
                    'analytics',
                ],
            ]);

        $videoPath = $response->json('data.video_path');
        $thumbnailPath = $response->json('data.thumbnail_path');

        Storage::disk('public')->assertExists($videoPath);
        Storage::disk('public')->assertExists($thumbnailPath);

        $this->assertDatabaseHas('videos', [
            'judul' => 'Legend of Timun Mas',
            'kreator_id' => $creator->user_id,
            'status' => 'draft',
        ]);
        $this->assertDatabaseHas('analytics', [
            'video_id' => $response->json('data.id'),
            'views' => 0,
        ]);
    }

    public function test_creator_can_filter_own_animations(): void
    {
        $creator = User::factory()->create(['role' => 'creator']);
        $otherCreator = User::factory()->create(['role' => 'creator']);

        Video::query()->create([
            'judul' => 'Published Match',
            'deskripsi' => 'Searchable story',
            'durasi' => 60,
            'url_video' => 'videos/published.mp4',
            'status' => 'published',
            'tanggal_upload' => now(),
            'kreator_id' => $creator->user_id,
        ]);

        Video::query()->create([
            'judul' => 'Other Creator Match',
            'deskripsi' => 'Searchable story',
            'durasi' => 60,
            'url_video' => 'videos/other.mp4',
            'status' => 'published',
            'tanggal_upload' => now(),
            'kreator_id' => $otherCreator->user_id,
        ]);

        Sanctum::actingAs($creator);

        $this->getJson('/api/v1/creator/animations?status=published&search=Match')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Published Match');
    }

    public function test_regular_user_cannot_access_creator_animation_routes(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'user']));

        $this->getJson('/api/v1/creator/animations')
            ->assertForbidden()
            ->assertJsonPath('success', false)
            ->assertJsonMissingPath('trace');
    }
}
