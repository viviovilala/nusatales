<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

require __DIR__.'/api_v1.php';

Route::middleware('throttle:10,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'NusaTales legacy API test endpoint is healthy.',
        'data' => [
            'timestamp' => now()->toISOString(),
        ],
    ]);
});
