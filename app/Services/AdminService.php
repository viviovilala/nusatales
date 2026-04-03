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
     * @return array<string, int|float>
     */
    public function dashboardStats(): array
    {
        return [
            'total_users' => User::count(),
            'total_creators' => User::where('role', 'kreator')->count(),
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
    }
}
