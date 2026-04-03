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
                'name' => 'Explorer',
                'description' => 'Basic access for active community members.',
                'price' => 50,
                'duration_days' => 30,
                'status' => 'active',
            ],
            [
                'name' => 'Creator Plus',
                'description' => 'Additional creator-oriented benefits and priority visibility.',
                'price' => 150,
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
