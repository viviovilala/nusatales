<?php

namespace App\Services;

use App\Models\Ad;
use App\Models\DailyMission;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AdminCatalogService
{
    public function plans(int $perPage = 15): LengthAwarePaginator
    {
        return SubscriptionPlan::query()
            ->orderBy('price')
            ->paginate($perPage);
    }

    public function createPlan(array $payload): SubscriptionPlan
    {
        return SubscriptionPlan::query()->create($payload);
    }

    public function updatePlan(SubscriptionPlan $plan, array $payload): SubscriptionPlan
    {
        $plan->update($payload);

        return $plan->refresh();
    }

    public function deletePlan(SubscriptionPlan $plan): void
    {
        $plan->delete();
    }

    public function missions(int $perPage = 15): LengthAwarePaginator
    {
        return DailyMission::query()
            ->orderBy('tipe')
            ->orderBy('judul')
            ->paginate($perPage);
    }

    public function createMission(array $payload): DailyMission
    {
        return DailyMission::query()->create($payload);
    }

    public function updateMission(DailyMission $mission, array $payload): DailyMission
    {
        $mission->update($payload);

        return $mission->refresh();
    }

    public function deleteMission(DailyMission $mission): void
    {
        $mission->delete();
    }

    public function ads(int $perPage = 15): LengthAwarePaginator
    {
        return Ad::query()
            ->with('video')
            ->orderByDesc('ads_id')
            ->paginate($perPage);
    }

    public function createAd(array $payload): Ad
    {
        return Ad::query()->create($payload)->load('video');
    }

    public function updateAd(Ad $ad, array $payload): Ad
    {
        $ad->update($payload);

        return $ad->refresh()->load('video');
    }

    public function deleteAd(Ad $ad): void
    {
        $ad->delete();
    }

    public function creators(int $perPage = 15, ?string $search = null): LengthAwarePaginator
    {
        return User::query()
            ->whereIn('role', ['kreator', 'admin'])
            ->when($search, function ($query) use ($search) {
                $query->where(function ($builder) use ($search) {
                    $builder
                        ->where('nama', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->withCount(['followers', 'videos'])
            ->orderBy('nama')
            ->paginate($perPage);
    }
}
