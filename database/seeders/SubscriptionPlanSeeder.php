<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Supporter',
                'description' => 'Akses fitur dasar NusaAdhi untuk mendukung kreator lokal.',
                'price' => 15000,
                'duration_days' => 30,
                'status' => 'active',
            ],
            [
                'name' => 'Explorer',
                'description' => 'Bebas iklan, akses lebih cepat, dan sneak peek episode yang belum dirilis.',
                'price' => 35000,
                'duration_days' => 30,
                'status' => 'active',
            ],
            [
                'name' => 'VIP/Creator Pack',
                'description' => 'Benefit lengkap Explorer ditambah akses unduhan aset kreator.',
                'price' => 75000,
                'duration_days' => 30,
                'status' => 'active',
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::query()->updateOrCreate(
                ['name' => $plan['name']],
                $plan
            );
        }
    }
}
