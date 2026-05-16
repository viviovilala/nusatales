<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {
    }

    public function register(RegisterRequest $request)
    {
        $result = $this->authService->register($request->validated());

        return $this->successResponse('Registrasi berhasil.', [
            'user' => new UserResource($result['user']),
            'token' => $result['token'],
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        $result = $this->authService->login($request->validated());

        return $this->successResponse('Login berhasil.', [
            'user' => new UserResource($result['user']),
            'token' => $result['token'],
        ]);
    }

    public function me(Request $request)
    {
        return $this->successResponse(
            'Data pengguna berhasil dimuat.',
            [
                'user' => new UserResource($request->user()->load('channel')),
            ]
        );
    }

    public function logout(Request $request)
    {
        $this->authService->logout($request->user());

        return $this->successResponse('Logout berhasil.', null);
    }

    public function updateProfile(UpdateProfileRequest $request)
    {
        $user = $this->authService->updateProfile($request->user(), $request->validated());

        return $this->successResponse('Profil berhasil diperbarui.', new UserResource($user));
    }
}
