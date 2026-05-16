<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function register(array $data): array
    {
        $profilePhotoPath = isset($data['foto_profil']) && $data['foto_profil'] instanceof UploadedFile
            ? $data['foto_profil']->store('profiles', 'public')
            : null;

        $user = User::create([
            'nama' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'foto_profil' => $profilePhotoPath,
            'tanggal_daftar' => now(),
            'role' => 'user',
        ]);

        $token = $user->createToken('web-client')->plainTextToken;

        $user->load('channel');

        return compact('user', 'token');
    }

    public function login(array $credentials): array
    {
        $user = User::query()->where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        $token = $user->createToken('web-client')->plainTextToken;

        $user->load('channel');

        return compact('user', 'token');
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete();
    }

    public function updateProfile(User $user, array $data): User
    {
        if (! empty($data['password'])) {
            if (empty($data['current_password']) || ! Hash::check($data['current_password'], $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => ['The current password is incorrect.'],
                ]);
            }

            $user->password = $data['password'];
        }

        if (array_key_exists('nama', $data)) {
            $user->nama = $data['nama'];
        }

        if (array_key_exists('email', $data)) {
            $user->email = $data['email'];
        }

        if (isset($data['foto_profil']) && $data['foto_profil'] instanceof UploadedFile) {
            if ($user->foto_profil && Storage::disk('public')->exists($user->foto_profil)) {
                Storage::disk('public')->delete($user->foto_profil);
            }

            $user->foto_profil = $data['foto_profil']->store('profiles', 'public');
        }

        $user->save();

        return $user->refresh()->load('channel');
    }
}
