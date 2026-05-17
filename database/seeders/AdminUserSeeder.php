<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@nusatales.test'],
            [
                'nama' => 'NusaTales Admin',
                'password' => Hash::make('Password123!'),
                'foto_profil' => null,
                'tanggal_daftar' => now(),
                'role' => 'admin',
            ]
        );
    }
}
