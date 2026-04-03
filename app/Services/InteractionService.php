<?php

namespace App\Services;

use App\Models\Comment;
use App\Models\Like;
use App\Models\Notification;
use App\Models\Share;
use App\Models\User;
use App\Models\UserPoint;
use App\Models\Video;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class InteractionService
{
    public function __construct(
        protected MissionService $missionService
    ) {
    }

    public function toggleLike(User $user, Video $video): array
    {
        $existing = Like::query()
            ->where('user_id', $user->user_id)
            ->where('video_id', $video->video_id)
            ->first();

        if ($existing) {
            $existing->delete();

            return [
                'liked' => false,
                'likes_count' => $video->likes()->count(),
            ];
        }

        Like::query()->create([
            'user_id' => $user->user_id,
            'video_id' => $video->video_id,
        ]);

        $this->awardPoints($user, 1);
        $this->missionService->progress($user, 'like');
        $this->notifyCreator($video, "{$user->nama} liked your animation \"{$video->judul}\".");

        return [
            'liked' => true,
            'likes_count' => $video->likes()->count(),
        ];
    }

    public function paginateComments(Video $video, int $perPage = 15): LengthAwarePaginator
    {
        return Comment::query()
            ->with('user')
            ->where('video_id', $video->video_id)
            ->orderByDesc('tanggal')
            ->paginate($perPage);
    }

    public function addComment(User $user, Video $video, string $content): Comment
    {
        $comment = Comment::query()->create([
            'user_id' => $user->user_id,
            'video_id' => $video->video_id,
            'isi_komentar' => $content,
            'tanggal' => now(),
        ]);

        $this->awardPoints($user, 2);
        $this->missionService->progress($user, 'comment');
        $this->notifyCreator($video, "{$user->nama} commented on your animation \"{$video->judul}\".");

        return $comment->load('user');
    }

    public function deleteComment(User $user, Comment $comment): void
    {
        if ($comment->user_id !== $user->user_id && ! $user->isAdmin()) {
            abort(403, 'You are not authorized to delete this comment.');
        }

        $comment->delete();
    }

    public function recordShare(User $user, Video $video, string $platform): Share
    {
        $share = Share::query()->create([
            'user_id' => $user->user_id,
            'video_id' => $video->video_id,
            'platform_share' => $platform,
        ]);

        $this->awardPoints($user, 3);
        $this->notifyCreator($video, "{$user->nama} shared your animation \"{$video->judul}\" to {$platform}.");

        return $share;
    }

    public function incrementView(Video $video): void
    {
        $analytics = $video->analytics()->firstOrCreate([
            'video_id' => $video->video_id,
        ], [
            'views' => 0,
            'watch_time' => 0,
            'engagement_rate' => 0,
        ]);

        $analytics->increment('views');
    }

    protected function notifyCreator(Video $video, string $message): void
    {
        if (! $video->kreator_id) {
            return;
        }

        Notification::query()->create([
            'user_id' => $video->kreator_id,
            'isi_notif' => $message,
            'status' => 'unread',
            'tanggal' => now(),
        ]);
    }

    protected function awardPoints(User $user, int $points): void
    {
        $wallet = UserPoint::query()->firstOrCreate(
            ['user_id' => $user->user_id],
            ['total_point' => 0]
        );

        $wallet->increment('total_point', $points);
    }
}
