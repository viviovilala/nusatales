<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class InvoiceService
{
    public function generateForPayment(object $payment): ?object
    {
        $existing = DB::table('invoices')->where('payment_id', $payment->id)->first();

        if ($existing) {
            return $existing;
        }

        $invoiceNumber = 'INV-'.now()->format('Ymd').'-'.str_pad((string) $payment->id, 6, '0', STR_PAD_LEFT);

        DB::table('invoices')->insert([
            'payment_id' => $payment->id,
            'user_id' => $payment->user_id,
            'invoice_number' => $invoiceNumber,
            'total' => $payment->gross_amount,
            'issued_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return DB::table('invoices')->where('invoice_number', $invoiceNumber)->first();
    }
}
