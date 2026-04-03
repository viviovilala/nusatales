<?php

namespace App\Services;

use App\Models\DailyMission;
use App\Models\NusaKoinTransaction;
use App\Models\User;
use App\Models\UserMission;
use App\Models\UserPoint;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class MissionService
{
    public function progress(User $user, string $type, int $increment = 1): void
    {
        $missions = DailyMission::query()->where('tipe', $type)->get();

        foreach ($missions as $mission) {
            $userMission = UserMission::query()->firstOrCreate(
                [
                    'user_id' => $user->user_id,
                    'mission_id' => $mission->mission_id,
                    'tanggal' => now()->toDateString(),
                ],
                [
                    'progress' => 0,
                    'status' => 'ongoing',
                ]
            );

            if ($userMission->status === 'completed') {
                continue;
            }

            $userMission->progress = min($mission->target, $userMission->progress + $increment);

            if ($userMission->progress >= $mission->target) {
                $userMission->status = 'completed';
                $this->rewardMission($user, $mission->reward_point, $mission->judul);
            }

            $userMission->save();
        }
    }

    public function list(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return UserMission::query()
            ->with('mission')
            ->where('user_id', $user->user_id)
            ->whereDate('tanggal', now()->toDateString())
            ->orderByDesc('user_mission_id')
            ->paginate($perPage);
    }

    protected function rewardMission(User $user, int $points, string $title): void
    {
        UserPoint::query()->firstOrCreate(
            ['user_id' => $user->user_id],
            ['total_point' => 0]
        )->increment('total_point', $points);

        NusaKoinTransaction::query()->create([
            'user_id' => $user->user_id,
            'type' => 'credit',
            'amount' => $points,
            'source' => 'daily_mission',
            'notes' => "Reward for mission: {$title}",
            'created_at' => now(),
        ]);
    }
}
