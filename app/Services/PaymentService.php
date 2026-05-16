<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentService
{
    public function __construct(
        protected PaymentGatewayInterface $gateway
    ) {
    }

    public function createCoinPackageCheckout(?User $user, string|int $packageId): array
    {
        $package = DB::table('coin_packages')
            ->where('id', $packageId)
            ->orWhere('code', $packageId)
            ->first();

        $package ??= (object) [
            'id' => $packageId,
            'name' => 'Paket Pemula',
            'coins' => 100,
            'bonus_coins' => 0,
            'price' => 10000,
            'code' => 'pemula',
        ];

        return $this->createCheckout($user, 'coin_package', (int) $package->price, [
            'package_id' => $package->id,
            'package_code' => $package->code,
            'coins' => (int) $package->coins + (int) $package->bonus_coins,
        ], $package->name);
    }

    public function createSubscriptionCheckout(?User $user, string|int $planId): array
    {
        $plan = DB::table('subscription_plans')
            ->where('plan_id', $planId)
            ->orWhere('name', $planId)
            ->first();

        $plan ??= (object) [
            'plan_id' => $planId,
            'name' => 'Explorer',
            'price' => 35000,
            'duration_days' => 30,
        ];

        return $this->createCheckout($user, 'subscription', (int) $plan->price, [
            'plan_id' => $plan->plan_id,
            'duration_days' => $plan->duration_days,
        ], 'NusaAdhi '.$plan->name);
    }

    public function createAssetCheckout(?User $user, string|int $assetId): array
    {
        $asset = DB::table('assets')
            ->where('id', $assetId)
            ->orWhere('slug', $assetId)
            ->first();

        $asset ??= (object) [
            'id' => $assetId,
            'title' => 'Modern Batik',
            'price' => 10000,
            'creator_id' => null,
        ];

        return $this->createCheckout($user, 'asset', (int) max($asset->price, 1000), [
            'asset_id' => $asset->id,
            'creator_id' => $asset->creator_id,
        ], $asset->title);
    }

    public function createCheckout(?User $user, string $type, int $amount, array $metadata, string $itemName): array
    {
        return DB::transaction(function () use ($user, $type, $amount, $metadata, $itemName) {
            $orderId = 'NT-'.now()->format('YmdHis').'-'.Str::upper(Str::random(6));

            $paymentId = DB::table('payments')->insertGetId([
                'user_id' => $user?->user_id,
                'order_id' => $orderId,
                'type' => $type,
                'gross_amount' => $amount,
                'currency' => 'IDR',
                'status' => 'pending',
                'metadata' => json_encode($metadata),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('payment_items')->insert([
                'payment_id' => $paymentId,
                'name' => $itemName,
                'quantity' => 1,
                'price' => $amount,
                'metadata' => json_encode($metadata),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $payment = DB::table('payments')->where('id', $paymentId)->first();
            $snap = $this->gateway->createSnapToken((array) $payment, [[
                'id' => (string) $paymentId,
                'price' => $amount,
                'quantity' => 1,
                'name' => $itemName,
            ]], $user ? [
                'first_name' => $user->nama,
                'email' => $user->email,
            ] : null);

            DB::table('payments')->where('id', $paymentId)->update([
                'snap_token' => $snap['snap_token'] ?? null,
                'redirect_url' => $snap['redirect_url'] ?? null,
                'updated_at' => now(),
            ]);

            return [
                'payment' => DB::table('payments')->where('id', $paymentId)->first(),
                'snap_token' => $snap['snap_token'] ?? null,
                'redirect_url' => $snap['redirect_url'] ?? null,
                'mode' => $snap['mode'] ?? 'snap',
            ];
        });
    }

    public function unlockVideoWithCoins(User $user, int $videoId, int $coins = 150): array
    {
        return DB::transaction(function () use ($user, $videoId, $coins) {
            $wallet = DB::table('wallets')->where('user_id', $user->user_id)->lockForUpdate()->first();

            if (! $wallet) {
                $walletId = DB::table('wallets')->insertGetId([
                    'user_id' => $user->user_id,
                    'balance' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $wallet = DB::table('wallets')->where('id', $walletId)->lockForUpdate()->first();
            }

            if ($wallet->balance < $coins) {
                abort(422, 'Saldo NusaKoin tidak cukup.');
            }

            $alreadyUnlocked = DB::table('video_unlocks')
                ->where('user_id', $user->user_id)
                ->where('video_id', $videoId)
                ->exists();

            if ($alreadyUnlocked) {
                return ['balance' => $wallet->balance, 'unlocked' => true];
            }

            DB::table('wallets')->where('id', $wallet->id)->update([
                'balance' => $wallet->balance - $coins,
                'updated_at' => now(),
            ]);

            DB::table('wallet_transactions')->insert([
                'wallet_id' => $wallet->id,
                'user_id' => $user->user_id,
                'type' => 'debit',
                'amount' => -$coins,
                'description' => 'Unlock premium video',
                'reference_type' => 'video',
                'reference_id' => $videoId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('video_unlocks')->insert([
                'user_id' => $user->user_id,
                'video_id' => $videoId,
                'coins_spent' => $coins,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return ['balance' => $wallet->balance - $coins, 'unlocked' => true];
        });
    }
}
