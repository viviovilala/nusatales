<?php

namespace App\Services;

use App\Models\NusaKoinTransaction;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Models\UserPoint;
use App\Models\UserSubscription;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SubscriptionService
{
    public function plans()
    {
        return SubscriptionPlan::query()
            ->where('status', 'active')
            ->orderBy('price')
            ->get();
    }

    public function subscribe(User $user, int $planId): UserSubscription
    {
        $plan = SubscriptionPlan::query()->where('plan_id', $planId)->where('status', 'active')->firstOrFail();
        $wallet = UserPoint::query()->firstOrCreate(
            ['user_id' => $user->user_id],
            ['total_point' => 0]
        );

        if ((int) $wallet->total_point < (int) $plan->price) {
            abort(422, 'Insufficient NusaKoin balance.');
        }

        $wallet->decrement('total_point', (int) $plan->price);

        NusaKoinTransaction::query()->create([
            'user_id' => $user->user_id,
            'type' => 'debit',
            'amount' => (int) $plan->price,
            'source' => 'subscription',
            'notes' => "Subscription purchase: {$plan->name}",
            'created_at' => now(),
        ]);

        UserSubscription::query()
            ->where('user_id', $user->user_id)
            ->where('status', 'active')
            ->update(['status' => 'cancelled']);

        return UserSubscription::query()->create([
            'user_id' => $user->user_id,
            'plan_id' => $plan->plan_id,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays($plan->duration_days)->toDateString(),
            'status' => 'active',
        ])->load('plan');
    }

    public function subscriptions(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return UserSubscription::query()
            ->with('plan')
            ->where('user_id', $user->user_id)
            ->orderByDesc('subscription_id')
            ->paginate($perPage);
    }

    public function transactions(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return NusaKoinTransaction::query()
            ->where('user_id', $user->user_id)
            ->orderByDesc('transaction_id')
            ->paginate($perPage);
    }
}
