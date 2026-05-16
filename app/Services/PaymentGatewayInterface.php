<?php

namespace App\Services;

interface PaymentGatewayInterface
{
    public function createSnapToken(array $payment, array $items = [], ?array $customer = null): array;

    public function verifySignature(array $payload): bool;
}
