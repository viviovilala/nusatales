<?php

namespace App\Services;

use Midtrans\Config;
use Midtrans\Snap;

class MidtransPaymentGateway implements PaymentGatewayInterface
{
    public function __construct()
    {
        Config::$serverKey = (string) config('services.midtrans.server_key');
        Config::$isProduction = (bool) config('services.midtrans.is_production', false);
        Config::$isSanitized = (bool) config('services.midtrans.is_sanitized', true);
        Config::$is3ds = (bool) config('services.midtrans.is_3ds', true);
    }

    public function createSnapToken(array $payment, array $items = [], ?array $customer = null): array
    {
        if (blank(config('services.midtrans.server_key'))) {
            return [
                'snap_token' => 'dummy-snap-token-'.$payment['order_id'],
                'redirect_url' => null,
                'mode' => 'dummy',
            ];
        }

        $params = [
            'transaction_details' => [
                'order_id' => $payment['order_id'],
                'gross_amount' => (int) $payment['gross_amount'],
            ],
            'item_details' => $items,
        ];

        if ($customer) {
            $params['customer_details'] = $customer;
        }

        $snapToken = Snap::getSnapToken($params);

        return [
            'snap_token' => $snapToken,
            'redirect_url' => null,
            'mode' => 'snap',
        ];
    }

    public function verifySignature(array $payload): bool
    {
        if (blank(config('services.midtrans.server_key'))) {
            return true;
        }

        $expected = hash(
            'sha512',
            ($payload['order_id'] ?? '').
            ($payload['status_code'] ?? '').
            ($payload['gross_amount'] ?? '').
            config('services.midtrans.server_key')
        );

        return hash_equals($expected, (string) ($payload['signature_key'] ?? ''));
    }
}
