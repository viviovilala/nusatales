<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminModerationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_moderate_animation_status(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $creator = User::factory()->create(['role' => 'creator']);
        $video = Video::query()->create([
            'judul' => 'Moderation Candidate',
            'deskripsi' => 'Needs review.',
            'durasi' => 120,
            'url_video' => 'videos/candidate.mp4',
            'status' => 'draft',
            'tanggal_upload' => now(),
            'kreator_id' => $creator->user_id,
        ]);

        Sanctum::actingAs($admin);

        $this->patchJson("/api/v1/admin/animations/{$video->video_id}/status", [
            'status' => 'rejected',
            'rejection_reason' => 'Thumbnail does not meet community guidelines.',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.rejection_reason', 'Thumbnail does not meet community guidelines.');

        $this->assertDatabaseHas('videos', [
            'video_id' => $video->video_id,
            'status' => 'rejected',
            'rejection_reason' => 'Thumbnail does not meet community guidelines.',
        ]);
    }

    public function test_non_admin_cannot_access_admin_moderation_routes(): void
    {
        $creator = User::factory()->create(['role' => 'creator']);

        Sanctum::actingAs($creator);

        $this->getJson('/api/v1/admin/animations')
            ->assertForbidden()
            ->assertJsonPath('success', false)
            ->assertJsonMissingPath('trace');
    }

    public function test_admin_dashboard_returns_core_statistics(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $creator = User::factory()->create(['role' => 'creator']);

        Video::query()->create([
            'judul' => 'Dashboard Video',
            'deskripsi' => 'Visible in stats.',
            'durasi' => 90,
            'url_video' => 'videos/dashboard.mp4',
            'status' => 'published',
            'tanggal_upload' => now(),
            'kreator_id' => $creator->user_id,
        ]);

        Sanctum::actingAs($admin);

        $this->getJson('/api/v1/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'totals' => [
                        'users',
                        'creators',
                        'animations',
                        'published',
                        'draft',
                        'rejected',
                        'views',
                    ],
                    'recent_uploads',
                ],
            ]);
    }
}
