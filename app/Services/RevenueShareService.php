<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class RevenueShareService
{
    public function record(object $payment, ?int $creatorId = null, string $sourceType = 'payment'): void
    {
        $metadata = json_decode((string) $payment->metadata, true) ?: [];
        $creatorId ??= $metadata['creator_id'] ?? null;

        if (! $creatorId) {
            return;
        }

        $creatorAmount = (int) floor($payment->gross_amount * 0.6);
        $platformAmount = (int) $payment->gross_amount - $creatorAmount;

        $exists = DB::table('revenue_ledgers')
            ->where('payment_id', $payment->id)
            ->where('source_type', $sourceType)
            ->exists();

        if ($exists) {
            return;
        }

        DB::table('revenue_ledgers')->insert([
            'payment_id' => $payment->id,
            'creator_id' => $creatorId,
            'gross_amount' => $payment->gross_amount,
            'creator_amount' => $creatorAmount,
            'platform_amount' => $platformAmount,
            'source_type' => $sourceType,
            'metadata' => json_encode(['creator_share' => 60, 'platform_share' => 40]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('creator_revenues')->insert([
            'creator_id' => $creatorId,
            'gross_amount' => $payment->gross_amount,
            'creator_amount' => $creatorAmount,
            'platform_amount' => $platformAmount,
            'source_type' => $sourceType,
            'source_id' => $payment->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
