<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserPoint;
use Illuminate\Database\Seeder;

class UserPointSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::query()->each(function (User $user) {
            UserPoint::query()->firstOrCreate(
                ['user_id' => $user->user_id],
                ['total_point' => $user->role === 'admin' ? 100 : 0]
            );
        });
    }
}
