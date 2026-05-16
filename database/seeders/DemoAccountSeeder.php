<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoAccountSeeder extends Seeder
{
    /**
     * Seed demo accounts for local development and automated verification.
     */
    public function run(): void
    {
        if (app()->isProduction() && ! filter_var(env('SEED_DEMO_ACCOUNTS', false), FILTER_VALIDATE_BOOL)) {
            return;
        }

        $accounts = [
            [
                'name' => 'Demo User',
                'email' => 'user@nusatales.test',
                'role' => 'user',
            ],
            [
                'name' => 'Demo Uploader',
                'email' => 'uploader@nusatales.test',
                'role' => 'user',
            ],
            [
                'name' => 'Demo Creator',
                'email' => 'creator@nusatales.test',
                'role' => 'user',
            ],
            [
                'name' => 'Demo Admin',
                'email' => 'admin@nusatales.test',
                'role' => 'admin',
            ],
        ];

        foreach ($accounts as $account) {
            User::query()->updateOrCreate(
                ['email' => $account['email']],
                [
                    'nama' => $account['name'],
                    'password' => Hash::make('Password123!'),
                    'foto_profil' => null,
                    'tanggal_daftar' => now(),
                    'role' => $account['role'],
                ]
            );
        }
    }
}
