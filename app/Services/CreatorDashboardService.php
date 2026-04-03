<?php

namespace App\Services;

use App\Models\User;
use App\Models\Video;

class CreatorDashboardService
{
    /**
     * @return array<string, int|float>
     */
    public function summary(User $user): array
    {
        $baseQuery = Video::query()->where('kreator_id', $user->user_id);

        return [
            'total_videos' => (clone $baseQuery)->count(),
            'published_videos' => (clone $baseQuery)->where('status', 'published')->count(),
            'draft_videos' => (clone $baseQuery)->where('status', 'draft')->count(),
            'rejected_videos' => (clone $baseQuery)->where('status', 'rejected')->count(),
            'total_views' => (int) Video::query()
                ->where('kreator_id', $user->user_id)
                ->leftJoin('analytics', 'analytics.video_id', '=', 'videos.video_id')
                ->sum('analytics.views'),
        ];
    }
}
