<?php

use App\Http\Controllers\Api\Admin\AdminDashboardController;
use App\Http\Controllers\Api\Admin\AdminAdController;
use App\Http\Controllers\Api\Admin\AdminMissionController;
use App\Http\Controllers\Api\Admin\AdminPlanController;
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\Admin\AdminVideoController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommunityController;
use App\Http\Controllers\Api\CreatorDirectoryController;
use App\Http\Controllers\Api\CreatorDashboardController;
use App\Http\Controllers\Api\CreatorMonetizationController;
use App\Http\Controllers\Api\CreatorVideoController;
use App\Http\Controllers\Api\InteractionController;
use App\Http\Controllers\Api\MissionController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PublicVideoController;
use App\Http\Controllers\Api\ReferenceController;
use App\Http\Controllers\Api\SubscriptionController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', function () {
        return response()->json([
            'success' => true,
            'message' => 'NusaTales API is healthy.',
            'data' => [
                'timestamp' => now()->toISOString(),
            ],
        ]);
    });

    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    Route::get('/references/categories', [ReferenceController::class, 'categories']);
    Route::get('/references/stories', [ReferenceController::class, 'stories']);
    Route::get('/subscriptions/plans', [SubscriptionController::class, 'plans']);
    Route::get('/creators', [CreatorDirectoryController::class, 'index']);

    Route::get('/animations', [PublicVideoController::class, 'index']);
    Route::get('/animations/{video}', [PublicVideoController::class, 'show']);
    Route::post('/animations/{video}/view', [InteractionController::class, 'view']);
    Route::get('/animations/{video}/comments', [InteractionController::class, 'comments']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::patch('/notifications/{notification}', [NotificationController::class, 'updateStatus']);
        Route::get('/wallet', [NotificationController::class, 'wallet']);
        Route::get('/missions', [MissionController::class, 'index']);
        Route::post('/subscriptions', [SubscriptionController::class, 'subscribe']);
        Route::get('/subscriptions', [SubscriptionController::class, 'subscriptions']);
        Route::get('/nusa-koin/transactions', [SubscriptionController::class, 'transactions']);
        Route::post('/creators/{creator}/follow', [CommunityController::class, 'follow']);
        Route::post('/animations/{video}/watch-history', [CommunityController::class, 'storeWatchHistory']);
        Route::get('/watch-history', [CommunityController::class, 'history']);

        Route::post('/animations/{video}/like', [InteractionController::class, 'like']);
        Route::post('/animations/{video}/comments', [InteractionController::class, 'storeComment']);
        Route::delete('/comments/{comment}', [InteractionController::class, 'destroyComment']);
        Route::post('/animations/{video}/share', [InteractionController::class, 'share']);

        Route::middleware('role:kreator,admin')->prefix('creator')->group(function () {
            Route::get('/dashboard', [CreatorDashboardController::class, 'index']);
            Route::get('/monetization/summary', [CreatorMonetizationController::class, 'summary']);
            Route::get('/monetization/earnings', [CreatorMonetizationController::class, 'earnings']);
            Route::get('/animations', [CreatorVideoController::class, 'index']);
            Route::post('/animations', [CreatorVideoController::class, 'store']);
            Route::get('/animations/{video}', [CreatorVideoController::class, 'show']);
            Route::match(['post', 'patch'], '/animations/{video}', [CreatorVideoController::class, 'update']);
            Route::delete('/animations/{video}', [CreatorVideoController::class, 'destroy']);
        });

        Route::middleware('role:admin')->prefix('admin')->group(function () {
            Route::get('/dashboard', [AdminDashboardController::class, 'index']);

            Route::get('/animations', [AdminVideoController::class, 'index']);
            Route::get('/animations/{video}', [AdminVideoController::class, 'show']);
            Route::patch('/animations/{video}/status', [AdminVideoController::class, 'updateStatus']);
            Route::delete('/animations/{video}', [AdminVideoController::class, 'destroy']);

            Route::get('/users', [AdminUserController::class, 'index']);
            Route::get('/users/{user}', [AdminUserController::class, 'show']);
            Route::match(['post', 'patch'], '/users/{user}', [AdminUserController::class, 'update']);
            Route::delete('/users/{user}', [AdminUserController::class, 'destroy']);

            Route::get('/plans', [AdminPlanController::class, 'index']);
            Route::post('/plans', [AdminPlanController::class, 'store']);
            Route::get('/plans/{plan}', [AdminPlanController::class, 'show']);
            Route::match(['post', 'patch'], '/plans/{plan}', [AdminPlanController::class, 'update']);
            Route::delete('/plans/{plan}', [AdminPlanController::class, 'destroy']);

            Route::get('/missions', [AdminMissionController::class, 'index']);
            Route::post('/missions', [AdminMissionController::class, 'store']);
            Route::get('/missions/{mission}', [AdminMissionController::class, 'show']);
            Route::match(['post', 'patch'], '/missions/{mission}', [AdminMissionController::class, 'update']);
            Route::delete('/missions/{mission}', [AdminMissionController::class, 'destroy']);

            Route::get('/ads', [AdminAdController::class, 'index']);
            Route::post('/ads', [AdminAdController::class, 'store']);
            Route::get('/ads/{ad}', [AdminAdController::class, 'show']);
            Route::match(['post', 'patch'], '/ads/{ad}', [AdminAdController::class, 'update']);
            Route::delete('/ads/{ad}', [AdminAdController::class, 'destroy']);
        });
    });
});
