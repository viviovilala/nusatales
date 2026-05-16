<?php

namespace App\Services;

use App\Http\Resources\ChannelResource;
use App\Models\Earning;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MonetizationService
{
    /**
     * @return array<string, float|int>
     */
    public function summary(User $user): array
    {
        $query = Earning::query()->where('kreator_id', $user->user_id);

        $channel = $user->channel()->first();
        $active = $channel?->monetization_status === 'active';

        return [
            'active' => $active,
            'status' => $channel?->monetization_status ?? 'inactive',
            'can_monetize' => $active,
            'creator_share_percentage' => 60,
            'platform_fee_percentage' => 40,
            'channel' => $channel ? (new ChannelResource($channel))->resolve() : null,
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

    public function agree(User $user, Request $request, ChannelService $channelService): array
    {
        $channel = $channelService->activateStudio($user);
        $agreementText = 'Saya menyetujui bahwa setiap pendapatan dari video/aset yang dimonetisasi akan dibagi 60% untuk kreator dan 40% untuk platform NusaTales.';

        DB::transaction(function () use ($user, $request, $channel, $agreementText) {
            DB::table('monetization_agreements')->updateOrInsert(
                ['user_id' => $user->user_id],
                [
                    'channel_id' => $channel->id,
                    'agreed' => true,
                    'platform_percentage' => 40,
                    'creator_percentage' => 60,
                    'creator_share_percent' => 60,
                    'platform_share_percent' => 40,
                    'agreement_text' => $agreementText,
                    'ip_address' => $request->ip(),
                    'user_agent' => substr((string) $request->userAgent(), 0, 1000),
                    'agreed_at' => now(),
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            $channel->forceFill([
                'monetization_status' => 'active',
                'monetization_agreed_at' => now(),
                'monetization_enabled_at' => now(),
                'platform_fee_percentage' => 40,
                'creator_share_percentage' => 60,
            ])->save();
        });

        return [
            'agreement_text' => $agreementText,
            'channel' => $channel->refresh(),
        ];
    }
}
