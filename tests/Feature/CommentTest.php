<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\User;
use App\Models\Video;
use App\Services\ChannelService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CommentTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_read_comments_but_cannot_post(): void
    {
        $video = $this->publishedVideo();
        $user = User::factory()->create(['role' => 'user']);

        Comment::query()->create([
            'user_id' => $user->user_id,
            'video_id' => $video->video_id,
            'isi_komentar' => 'Komentar publik.',
            'body' => 'Komentar publik.',
            'status' => 'published',
            'tanggal' => now(),
            'created_at' => now(),
        ]);

        $this->getJson("/api/v1/videos/{$video->video_id}/comments")
            ->assertOk()
            ->assertJsonPath('message', 'Komentar berhasil dimuat.')
            ->assertJsonCount(1, 'data');

        $this->postJson("/api/v1/videos/{$video->video_id}/comments", [
            'body' => 'Tidak boleh.',
        ])->assertUnauthorized();
    }

    public function test_logged_in_user_can_post_comment_and_reply(): void
    {
        $video = $this->publishedVideo();
        $user = User::factory()->create(['role' => 'user']);

        Sanctum::actingAs($user);

        $commentId = $this->postJson("/api/v1/videos/{$video->video_id}/comments", [
            'body' => '<b>Karya yang hangat.</b>',
        ])
            ->assertCreated()
            ->assertJsonPath('message', 'Komentar berhasil dikirim.')
            ->assertJsonPath('data.comment.body', 'Karya yang hangat.')
            ->json('data.comment.id');

        $this->postJson("/api/v1/comments/{$commentId}/reply", [
            'content' => 'Setuju.',
        ])
            ->assertCreated()
            ->assertJsonPath('data.comment.parent_id', $commentId);

        $this->getJson("/api/v1/videos/{$video->video_id}/comments")
            ->assertOk()
            ->assertJsonPath('data.0.replies.0.body', 'Setuju.');

        $this->assertDatabaseHas('videos', [
            'video_id' => $video->video_id,
            'comment_count' => 2,
        ]);
    }

    public function test_comment_owner_can_delete_own_comment(): void
    {
        $video = $this->publishedVideo();
        $user = User::factory()->create(['role' => 'user']);
        $comment = Comment::query()->create([
            'user_id' => $user->user_id,
            'video_id' => $video->video_id,
            'isi_komentar' => 'Hapus saya.',
            'body' => 'Hapus saya.',
            'status' => 'published',
            'tanggal' => now(),
            'created_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $this->deleteJson("/api/v1/comments/{$comment->comment_id}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('comments', [
            'comment_id' => $comment->comment_id,
        ]);
    }

    public function test_cannot_comment_when_video_comments_are_disabled(): void
    {
        $video = $this->publishedVideo(['allow_comments' => false]);
        $user = User::factory()->create(['role' => 'user']);

        Sanctum::actingAs($user);

        $this->postJson("/api/v1/videos/{$video->video_id}/comments", [
            'body' => 'Tidak bisa.',
        ])->assertUnprocessable();
    }

    protected function publishedVideo(array $overrides = []): Video
    {
        $owner = User::factory()->create(['role' => 'user']);
        $channel = app(ChannelService::class)->activateStudio($owner);

        return Video::query()->create([
            'judul' => 'Video Komentar',
            'slug' => 'video-komentar-'.uniqid(),
            'durasi' => 120,
            'url_video' => 'videos/comment.mp4',
            'video_path' => 'videos/comment.mp4',
            'status' => 'published',
            'visibility' => 'public',
            'content_type' => 'episode',
            'format' => 'normal',
            'allow_comments' => true,
            'published_at' => now(),
            'tanggal_upload' => now(),
            'kreator_id' => $owner->user_id,
            'channel_id' => $channel->id,
            ...$overrides,
        ]);
    }
}
