<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Video;
use App\Services\ChannelService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_channel_owner_can_access_creator_routes(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        app(ChannelService::class)->activateStudio($user);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/creator/dashboard')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_normal_user_cannot_access_admin_routes(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'user']));

        $this->getJson('/api/v1/admin/dashboard')
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_admin_can_access_admin_routes(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->getJson('/api/v1/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_user_cannot_update_another_users_video_from_studio_route(): void
    {
        $owner = User::factory()->create(['role' => 'user']);
        $other = User::factory()->create(['role' => 'user']);
        $channel = app(ChannelService::class)->activateStudio($owner);

        $video = Video::query()->create([
            'judul' => 'Owned Video',
            'slug' => 'owned-video',
            'deskripsi' => 'Private studio record.',
            'durasi' => 60,
            'url_video' => 'videos/owned.mp4',
            'video_path' => 'videos/owned.mp4',
            'status' => 'draft',
            'visibility' => 'private',
            'content_type' => 'episode',
            'format' => 'normal',
            'tanggal_upload' => now(),
            'kreator_id' => $owner->user_id,
            'channel_id' => $channel->id,
        ]);

        Sanctum::actingAs($other);

        $this->patchJson("/api/v1/creator/animations/{$video->video_id}", [
            'judul' => 'Stolen Update',
        ])->assertNotFound();
    }
}
