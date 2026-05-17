<?php

use App\Http\Controllers\Api\Admin\AdminDashboardController;
use App\Http\Controllers\Api\Admin\AdminAdController;
use App\Http\Controllers\Api\Admin\AdminMissionController;
use App\Http\Controllers\Api\Admin\AdminPlanController;
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\Admin\AdminVideoController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\CommunityController;
use App\Http\Controllers\Api\CreatorDirectoryController;
use App\Http\Controllers\Api\CreatorDashboardController;
use App\Http\Controllers\Api\CreatorMonetizationController;
use App\Http\Controllers\Api\CreatorVideoController;
use App\Http\Controllers\Api\EpisodeController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\GenreController;
use App\Http\Controllers\Api\InteractionController;
use App\Http\Controllers\Api\MissionController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PlatformController;
use App\Http\Controllers\Api\PublicVideoController;
use App\Http\Controllers\Api\RatingController;
use App\Http\Controllers\Api\ReferenceController;
use App\Http\Controllers\Api\SeriesController;
use App\Http\Controllers\Api\StudioController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Models\User;
use App\Services\ChannelService;
use Illuminate\Support\Facades\Hash;
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

    Route::middleware('throttle:10,1')->group(function () {
        Route::post('/auth/register', [AuthController::class, 'register']);
        Route::post('/auth/login', [AuthController::class, 'login']);
    });

    Route::post('/dev/demo-upload-login', function (ChannelService $channelService) {
        if (! app()->environment(['local', 'testing'])) {
            abort(404);
        }

        $user = User::query()->updateOrCreate(
            ['email' => 'uploader@nusatales.test'],
            [
                'nama' => 'Demo Uploader',
                'password' => Hash::make('Password123!'),
                'foto_profil' => null,
                'tanggal_daftar' => now(),
                'role' => 'user',
            ]
        );

        $channel = $channelService->activateStudio($user);

        if ($channel->status !== 'active') {
            $channel->forceFill(['status' => 'active'])->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Demo uploader login berhasil.',
            'data' => [
                'user' => $user->refresh()->load('channel'),
                'token' => $user->createToken('demo-upload')->plainTextToken,
            ],
        ]);
    });

    Route::get('/references/categories', [ReferenceController::class, 'categories']);
    Route::get('/references/stories', [ReferenceController::class, 'stories']);
    Route::get('/categories', [CatalogController::class, 'categories']);
    Route::get('/genres', [GenreController::class, 'index']);
    Route::get('/regions', [CatalogController::class, 'regions']);
    Route::get('/regions/{slug}/series', [CatalogController::class, 'regionSeries']);
    Route::get('/search', [CatalogController::class, 'search']);
    Route::get('/coin-packages', [PlatformController::class, 'coinPackages']);
    Route::get('/assets', [PlatformController::class, 'assets']);
    Route::get('/assets/{slug}', [PlatformController::class, 'asset']);
    Route::get('/challenges', [PlatformController::class, 'challenges']);
    Route::get('/challenges/{slug}', [PlatformController::class, 'challenge']);
    Route::get('/challenges/{challenge}/leaderboard', [PlatformController::class, 'challengeLeaderboard'])->whereNumber('challenge');
    Route::get('/cultural-progress', [PlatformController::class, 'culturalProgress']);
    Route::get('/badges', [PlatformController::class, 'badges']);
    Route::get('/subscriptions/plans', [SubscriptionController::class, 'plans']);
    Route::get('/creators', [CreatorDirectoryController::class, 'index']);

    Route::get('/series', [SeriesController::class, 'index']);
    Route::get('/series/popular', [SeriesController::class, 'popular']);
    Route::get('/series/{slug}', [SeriesController::class, 'show']);
    Route::get('/series/{slug}/episodes', [SeriesController::class, 'episodes']);
    Route::get('/episodes/latest', [EpisodeController::class, 'latest']);
    Route::get('/episodes/{episode}', [EpisodeController::class, 'show']);

    Route::get('/videos', [PublicVideoController::class, 'index']);
    Route::get('/videos/featured', [PublicVideoController::class, 'featured']);
    Route::get('/videos/trending', [PublicVideoController::class, 'trending']);
    Route::get('/videos/latest', [PublicVideoController::class, 'latest']);
    Route::get('/videos/recommended', [PublicVideoController::class, 'recommended']);
    Route::get('/shorts', [PublicVideoController::class, 'shorts']);
    Route::get('/videos/{video}/comments', [InteractionController::class, 'comments']);
    Route::post('/videos/{video}/view', [InteractionController::class, 'view']);
    Route::get('/videos/{video}', [PublicVideoController::class, 'show']);
    Route::get('/animations', [PublicVideoController::class, 'index']);
    Route::get('/animations/{video}', [PublicVideoController::class, 'show']);
    Route::post('/animations/{video}/view', [InteractionController::class, 'view']);
    Route::get('/animations/{video}/comments', [InteractionController::class, 'comments']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::match(['post', 'patch'], '/auth/profile', [AuthController::class, 'updateProfile']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::patch('/notifications/{notification}', [NotificationController::class, 'updateStatus']);
        Route::get('/wallet', [NotificationController::class, 'wallet']);
        Route::post('/coin-packages/{package}/checkout', [PlatformController::class, 'checkoutCoinPackage']);
        Route::get('/me/billing', [PlatformController::class, 'billing']);
        Route::get('/me/cultural-progress', [PlatformController::class, 'culturalProgress']);
        Route::get('/me/badges', [PlatformController::class, 'badges']);
        Route::get('/missions', [MissionController::class, 'index']);
        Route::get('/continue-watching', [EpisodeController::class, 'continueWatching']);
        Route::post('/episodes/{episode}/progress', [EpisodeController::class, 'storeProgress']);
        Route::get('/favorites', [FavoriteController::class, 'index']);
        Route::post('/favorites', [FavoriteController::class, 'store']);
        Route::delete('/favorites/{favorite}', [FavoriteController::class, 'destroy']);
        Route::post('/ratings', [RatingController::class, 'store']);
        Route::post('/subscriptions', [SubscriptionController::class, 'subscribe']);
        Route::get('/subscriptions', [SubscriptionController::class, 'subscriptions']);
        Route::get('/nusa-koin/transactions', [SubscriptionController::class, 'transactions']);
        Route::post('/creators/{creator}/follow', [CommunityController::class, 'follow']);
        Route::post('/animations/{video}/watch-history', [CommunityController::class, 'storeWatchHistory']);
        Route::get('/watch-history', [CommunityController::class, 'history']);

        Route::post('/animations/{video}/like', [InteractionController::class, 'like']);
        Route::post('/videos/{video}/like', [InteractionController::class, 'like']);
        Route::delete('/videos/{video}/like', [InteractionController::class, 'like']);
        Route::post('/animations/{video}/comments', [InteractionController::class, 'storeComment']);
        Route::post('/videos/{video}/comments', [InteractionController::class, 'storeComment']);
        Route::post('/comments/{comment}/reply', [InteractionController::class, 'replyComment']);
        Route::delete('/comments/{comment}', [InteractionController::class, 'destroyComment']);
        Route::post('/animations/{video}/share', [InteractionController::class, 'share']);
        Route::post('/videos/{video}/share', [InteractionController::class, 'share']);

        Route::prefix('creator')->group(function () {
            Route::get('/studio-status', [StudioController::class, 'status']);
            Route::post('/activate-studio', [StudioController::class, 'activate']);
            Route::get('/dashboard', [CreatorDashboardController::class, 'index']);
            Route::get('/monetization/summary', [CreatorMonetizationController::class, 'summary']);
            Route::get('/monetization/earnings', [CreatorMonetizationController::class, 'earnings']);
            Route::post('/monetization/agree', [CreatorMonetizationController::class, 'agree']);
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
