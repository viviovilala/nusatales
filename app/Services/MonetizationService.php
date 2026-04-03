<?php

namespace App\Services;

use App\Models\Earning;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class MonetizationService
{
    /**
     * @return array<string, float|int>
     */
    public function summary(User $user): array
    {
        $query = Earning::query()->where('kreator_id', $user->user_id);

        return [
            'total_earnings' => (float) $query->sum('jumlah_pendapatan'),
            'current_month_earnings' => (float) Earning::query()
                ->where('kreator_id', $user->user_id)
                ->whereMonth('tanggal', now()->month)
                ->whereYear('tanggal', now()->year)
                ->sum('jumlah_pendapatan'),
            'transactions' => (int) Earning::query()
                ->where('kreator_id', $user->user_id)
                ->count(),
        ];
    }

    public function paginate(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return Earning::query()
            ->with('video')
            ->where('kreator_id', $user->user_id)
            ->orderByDesc('tanggal')
            ->paginate($perPage);
    }
}
