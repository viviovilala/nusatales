<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Models\UserPoint;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class NotificationService
{
    public function paginate(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return Notification::query()
            ->where('user_id', $user->user_id)
            ->orderByDesc('tanggal')
            ->paginate($perPage);
    }

    public function updateStatus(User $user, int $notificationId, string $status): Notification
    {
        $notification = Notification::query()
            ->where('user_id', $user->user_id)
            ->where('notif_id', $notificationId)
            ->firstOrFail();

        $notification->update([
            'status' => $status,
        ]);

        return $notification;
    }

    /**
     * @return array<string, int>
     */
    public function wallet(User $user): array
    {
        $points = UserPoint::query()->firstOrCreate(
            ['user_id' => $user->user_id],
            ['total_point' => 0]
        );

        return [
            'total_point' => (int) $points->total_point,
            'unread_notifications' => Notification::query()
                ->where('user_id', $user->user_id)
                ->where('status', 'unread')
                ->count(),
        ];
    }
}
