<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class WebhookService
{
    public function __construct(
        protected PaymentGatewayInterface $gateway,
        protected InvoiceService $invoiceService,
        protected RevenueShareService $revenueShareService,
    ) {
    }

    public function handleMidtrans(array $payload): array
    {
        if (! $this->gateway->verifySignature($payload)) {
            abort(403, 'Invalid Midtrans signature.');
        }

        return DB::transaction(function () use ($payload) {
            $transactionId = $payload['transaction_id'] ?? null;
            $orderId = $payload['order_id'] ?? null;

            $existingLog = $transactionId
                ? DB::table('payment_webhook_logs')->where('transaction_id', $transactionId)->where('processed', true)->first()
                : null;

            if ($existingLog) {
                return ['processed' => false, 'idempotent' => true];
            }

            $logId = DB::table('payment_webhook_logs')->insertGetId([
                'provider' => 'midtrans',
                'transaction_id' => $transactionId,
                'order_id' => $orderId,
                'payload' => json_encode($payload),
                'processed' => false,
                'status' => $payload['transaction_status'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $payment = DB::table('payments')->where('order_id', $orderId)->lockForUpdate()->first();

            if (! $payment) {
                DB::table('payment_webhook_logs')->where('id', $logId)->update([
                    'processed' => true,
                    'updated_at' => now(),
                ]);

                return ['processed' => true, 'payment_found' => false];
            }

            $status = $payload['transaction_status'] ?? 'pending';
            $isPaid = in_array($status, ['settlement', 'capture'], true)
                && (($payload['fraud_status'] ?? 'accept') === 'accept');

            if ($isPaid && $payment->status !== 'paid') {
                DB::table('payments')->where('id', $payment->id)->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                    'updated_at' => now(),
                ]);

                $payment = DB::table('payments')->where('id', $payment->id)->first();
                $this->applyPaidEffects($payment);
            } elseif (in_array($status, ['deny', 'cancel', 'expire', 'failure'], true)) {
                DB::table('payments')->where('id', $payment->id)->update([
                    'status' => 'failed',
                    'updated_at' => now(),
                ]);
            }

            DB::table('payment_webhook_logs')->where('id', $logId)->update([
                'processed' => true,
                'updated_at' => now(),
            ]);

            return ['processed' => true, 'payment_found' => true, 'paid' => $isPaid];
        });
    }

    protected function applyPaidEffects(object $payment): void
    {
        $metadata = json_decode((string) $payment->metadata, true) ?: [];

        if ($payment->type === 'coin_package' && $payment->user_id) {
            $wallet = DB::table('wallets')->where('user_id', $payment->user_id)->lockForUpdate()->first();
            $walletId = $wallet?->id ?? DB::table('wallets')->insertGetId([
                'user_id' => $payment->user_id,
                'balance' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $wallet = DB::table('wallets')->where('id', $walletId)->lockForUpdate()->first();
            $coins = (int) ($metadata['coins'] ?? 0);

            DB::table('wallets')->where('id', $wallet->id)->update([
                'balance' => $wallet->balance + $coins,
                'updated_at' => now(),
            ]);

            $alreadyCredited = DB::table('wallet_transactions')
                ->where('reference_type', 'payment')
                ->where('reference_id', $payment->id)
                ->exists();

            if (! $alreadyCredited) {
                DB::table('wallet_transactions')->insert([
                    'wallet_id' => $wallet->id,
                    'user_id' => $payment->user_id,
                    'type' => 'credit',
                    'amount' => $coins,
                    'description' => 'Isi Saldo NusaKoin',
                    'reference_type' => 'payment',
                    'reference_id' => $payment->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        if ($payment->type === 'subscription' && $payment->user_id) {
            DB::table('user_subscriptions')->insert([
                'user_id' => $payment->user_id,
                'plan_id' => $metadata['plan_id'] ?? null,
                'start_date' => now()->toDateString(),
                'end_date' => now()->addDays((int) ($metadata['duration_days'] ?? 30))->toDateString(),
                'status' => 'active',
            ]);
        }

        if ($payment->type === 'asset' && $payment->user_id) {
            DB::table('asset_orders')->insert([
                'user_id' => $payment->user_id,
                'payment_id' => $payment->id,
                'total' => $payment->gross_amount,
                'status' => 'paid',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->invoiceService->generateForPayment($payment);
        $this->revenueShareService->record($payment, $metadata['creator_id'] ?? null, $payment->type);
    }
}
