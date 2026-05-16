<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Video;
use App\Services\ChannelService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicVideoApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_videos_can_be_filtered_by_content_type(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $channel = app(ChannelService::class)->activateStudio($user);

        Video::query()->create([
            'judul' => 'Episode Published',
            'slug' => 'episode-published',
            'durasi' => 120,
            'url_video' => 'videos/episode.mp4',
            'video_path' => 'videos/episode.mp4',
            'status' => 'published',
            'visibility' => 'public',
            'content_type' => 'episode',
            'format' => 'normal',
            'published_at' => now(),
            'tanggal_upload' => now(),
            'kreator_id' => $user->user_id,
            'channel_id' => $channel->id,
        ]);

        Video::query()->create([
            'judul' => 'Short Published',
            'slug' => 'short-published',
            'durasi' => 30,
            'url_video' => 'videos/short.mp4',
            'video_path' => 'videos/short.mp4',
            'status' => 'published',
            'visibility' => 'public',
            'content_type' => 'short',
            'format' => 'short',
            'published_at' => now(),
            'tanggal_upload' => now(),
            'kreator_id' => $user->user_id,
            'channel_id' => $channel->id,
        ]);

        $this->getJson('/api/v1/videos?content_type=short')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'short-published');

        $this->getJson('/api/v1/videos?content_type=episode')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'episode-published');
    }

    public function test_public_video_detail_supports_slug(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $channel = app(ChannelService::class)->activateStudio($user);

        Video::query()->create([
            'judul' => 'Slug Detail',
            'slug' => 'slug-detail',
            'durasi' => 120,
            'url_video' => 'videos/detail.mp4',
            'video_path' => 'videos/detail.mp4',
            'status' => 'published',
            'visibility' => 'public',
            'content_type' => 'episode',
            'format' => 'normal',
            'published_at' => now(),
            'tanggal_upload' => now(),
            'kreator_id' => $user->user_id,
            'channel_id' => $channel->id,
        ]);

        $this->getJson('/api/v1/videos/slug-detail')
            ->assertOk()
            ->assertJsonPath('data.slug', 'slug-detail');
    }

    public function test_shorts_endpoint_returns_only_short_content(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $channel = app(ChannelService::class)->activateStudio($user);

        foreach (['episode' => 'normal', 'short' => 'short'] as $type => $format) {
            Video::query()->create([
                'judul' => "Video {$type}",
                'slug' => "video-{$type}",
                'durasi' => 30,
                'url_video' => "videos/{$type}.mp4",
                'video_path' => "videos/{$type}.mp4",
                'status' => 'published',
                'visibility' => 'public',
                'content_type' => $type,
                'format' => $format,
                'published_at' => now(),
                'tanggal_upload' => now(),
                'kreator_id' => $user->user_id,
                'channel_id' => $channel->id,
            ]);
        }

        $this->getJson('/api/v1/shorts')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.content_type', 'short');
    }
}
