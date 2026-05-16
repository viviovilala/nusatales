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
        return $this->like($user, $video);
    }

    public function like(User $user, Video $video): array
    {
        $existing = Like::query()
            ->where('user_id', $user->user_id)
            ->where('video_id', $video->video_id)
            ->first();

        if ($existing) {
            return [
                'liked' => true,
                'likes_count' => $this->refreshLikeCount($video),
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
            'likes_count' => $this->refreshLikeCount($video),
        ];
    }

    public function unlike(User $user, Video $video): array
    {
        Like::query()
            ->where('user_id', $user->user_id)
            ->where('video_id', $video->video_id)
            ->delete();

        return [
            'liked' => false,
            'likes_count' => $this->refreshLikeCount($video),
        ];
    }

    public function paginateComments(Video $video, int $perPage = 15): LengthAwarePaginator
    {
        return Comment::query()
            ->with(['user', 'replies.user'])
            ->where('video_id', $video->video_id)
            ->whereNull('parent_id')
            ->where('status', 'published')
            ->orderByDesc('tanggal')
            ->paginate($perPage);
    }

    public function addComment(User $user, Video $video, string $content, ?Comment $parent = null): Comment
    {
        if (! ($video->allow_comments ?? true)) {
            abort(422, 'Komentar untuk video ini sedang dinonaktifkan.');
        }

        if ($parent && (int) $parent->video_id !== (int) $video->video_id) {
            abort(422, 'Komentar induk tidak sesuai dengan video.');
        }

        $body = trim(strip_tags($content));

        if ($body === '') {
            abort(422, 'Komentar tidak boleh kosong.');
        }

        $comment = Comment::query()->create([
            'user_id' => $user->user_id,
            'video_id' => $video->video_id,
            'parent_id' => $parent?->comment_id,
            'isi_komentar' => $body,
            'body' => $body,
            'status' => 'published',
            'tanggal' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->refreshCommentCount($video);
        $this->awardPoints($user, 2);
        $this->missionService->progress($user, 'comment');
        $this->notifyCreator($video, "{$user->nama} commented on your animation \"{$video->judul}\".");

        return $comment->load(['user', 'replies.user']);
    }

    public function deleteComment(User $user, Comment $comment): void
    {
        if ($comment->user_id !== $user->user_id && ! $user->isAdmin()) {
            abort(403, 'You are not authorized to delete this comment.');
        }

        $video = $comment->video;
        $comment->status = 'deleted';
        $comment->save();
        $comment->delete();

        if ($video) {
            $this->refreshCommentCount($video);
        }
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
        $video->increment('view_count');
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

    protected function refreshCommentCount(Video $video): void
    {
        $video->forceFill([
            'comment_count' => $video->comments()->where('status', 'published')->count(),
        ])->save();
    }

    protected function refreshLikeCount(Video $video): int
    {
        $count = $video->likes()->count();

        $video->forceFill([
            'like_count' => $count,
        ])->save();

        return $count;
    }
}
