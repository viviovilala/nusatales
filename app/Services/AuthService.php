<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    public function register(array $data): array
    {
        $profilePhotoPath = isset($data['foto_profil']) && $data['foto_profil'] instanceof UploadedFile
            ? $data['foto_profil']->store('profiles', 'public')
            : null;

        $user = User::create([
            'nama' => $data['nama'],
            'email' => $data['email'],
            'password' => $data['password'],
            'foto_profil' => $profilePhotoPath,
            'tanggal_daftar' => now(),
            'role' => $data['role'] ?? 'user',
        ]);

        $token = $user->createToken($data['device_name'] ?? 'web-client')->plainTextToken;

        return compact('user', 'token');
    }

    public function login(array $credentials): array
    {
        $user = User::query()->where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw new AuthenticationException('Invalid credentials.');
        }

        $token = $user->createToken($credentials['device_name'] ?? 'web-client')->plainTextToken;

        return compact('user', 'token');
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete();
    }
}
