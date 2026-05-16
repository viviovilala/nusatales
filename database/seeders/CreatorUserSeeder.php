<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class CreatorUserSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'creator@nusatales.test'],
            [
                'nama' => 'NusaTales Creator',
                'password' => 'Password123!',
                'foto_profil' => null,
                'tanggal_daftar' => now(),
                'role' => 'user',
            ]
        );
    }
}
