<?php

namespace App\Services;

use App\Models\Ad;
use App\Models\Analytics;
use App\Models\DailyMission;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Models\Video;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;

class AdminService
{
    public function userList(array $filters): LengthAwarePaginator
    {
        $search = $filters['search'] ?? null;

        return User::query()
            ->when($search, function ($query) use ($search) {
                $query->where(function ($builder) use ($search) {
                    $builder
                        ->where('nama', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($filters['role'] ?? null, fn ($query, $role) => $query->where('role', $role))
            ->orderByDesc('tanggal_daftar')
            ->paginate($filters['per_page'] ?? 15)
            ->withQueryString();
    }

    public function updateUser(User $user, array $data): User
    {
        if (isset($data['foto_profil']) && $data['foto_profil'] instanceof UploadedFile) {
            $data['foto_profil'] = $data['foto_profil']->store('profiles', 'public');
        }

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->fill($data);
        $user->save();

        return $user->refresh();
    }

    public function deleteUser(User $user): void
    {
        if ($user->videos()->exists()) {
            throw new ConflictHttpException('User still owns animation content and cannot be deleted.');
        }

        $user->tokens()->delete();
        $user->delete();
    }

    /**
     * @return array<string, mixed>
     */
    public function dashboardStats(): array
    {
        $stats = [
            'total_users' => User::count(),
            'total_creators' => User::where('role', 'creator')->count(),
            'total_admins' => User::where('role', 'admin')->count(),
            'total_videos' => Video::count(),
            'published_videos' => Video::where('status', 'published')->count(),
            'draft_videos' => Video::where('status', 'draft')->count(),
            'rejected_videos' => Video::where('status', 'rejected')->count(),
            'total_views' => (int) Analytics::sum('views'),
            'total_ads' => Ad::count(),
            'total_subscription_plans' => SubscriptionPlan::count(),
            'total_daily_missions' => DailyMission::count(),
        ];

        return [
            ...$stats,
            'totals' => [
                'users' => $stats['total_users'],
                'creators' => $stats['total_creators'],
                'admins' => $stats['total_admins'],
                'animations' => $stats['total_videos'],
                'published' => $stats['published_videos'],
                'draft' => $stats['draft_videos'],
                'rejected' => $stats['rejected_videos'],
                'views' => $stats['total_views'],
                'ads' => $stats['total_ads'],
                'subscription_plans' => $stats['total_subscription_plans'],
                'daily_missions' => $stats['total_daily_missions'],
            ],
            'recent_uploads' => Video::query()
                ->with('creator')
                ->orderByDesc('tanggal_upload')
                ->limit(5)
                ->get()
                ->map(fn (Video $video) => [
                    'id' => $video->video_id,
                    'title' => $video->judul,
                    'status' => $video->status,
                    'creator' => $video->creator?->nama,
                    'uploaded_at' => optional($video->tanggal_upload)->toISOString(),
                ])
                ->values(),
        ];
    }
}
