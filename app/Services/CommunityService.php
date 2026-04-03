<?php

namespace App\Services;

use App\Models\Follow;
use App\Models\User;
use App\Models\WatchHistory;
use App\Models\Video;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CommunityService
{
    public function toggleFollow(User $user, User $creator): array
    {
        if (! $creator->isCreator() || $user->user_id === $creator->user_id) {
            abort(422, 'Invalid creator target.');
        }

        $existing = Follow::query()
            ->where('user_id', $user->user_id)
            ->where('kreator_id', $creator->user_id)
            ->first();

        if ($existing) {
            $existing->delete();

            return [
                'following' => false,
                'followers_count' => $creator->followers()->count(),
            ];
        }

        Follow::query()->create([
            'user_id' => $user->user_id,
            'kreator_id' => $creator->user_id,
        ]);

        return [
            'following' => true,
            'followers_count' => $creator->followers()->count(),
        ];
    }

    public function recordWatchHistory(User $user, Video $video, int $duration): WatchHistory
    {
        return WatchHistory::query()->create([
            'user_id' => $user->user_id,
            'video_id' => $video->video_id,
            'durasi_tonton' => $duration,
            'waktu_tonton' => now(),
        ]);
    }

    public function watchHistory(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return WatchHistory::query()
            ->with('video')
            ->where('user_id', $user->user_id)
            ->orderByDesc('waktu_tonton')
            ->paginate($perPage);
    }
}
