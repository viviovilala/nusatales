<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
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

        return $this->successResponse('Registration successful.', [
            'token' => $result['token'],
            'user' => new UserResource($result['user']),
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        $result = $this->authService->login($request->validated());

        return $this->successResponse('Login successful.', [
            'token' => $result['token'],
            'user' => new UserResource($result['user']),
        ]);
    }

    public function me(Request $request)
    {
        return $this->successResponse('Authenticated user retrieved successfully.', new UserResource($request->user()));
    }

    public function logout(Request $request)
    {
        $this->authService->logout($request->user());

        return $this->successResponse('Logout successful.', null);
    }
}
