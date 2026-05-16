<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\ChannelResource;
use App\Services\AdminCatalogService;
use Illuminate\Http\Request;

class CreatorDirectoryController extends Controller
{
    public function __construct(
        protected AdminCatalogService $adminCatalogService
    ) {
    }

    public function index(Request $request)
    {
        $paginator = $this->adminCatalogService->creators(
            (int) $request->integer('per_page', 15),
            $request->string('search')->toString() ?: null
        );

        return $this->successResponse('Creators retrieved successfully.', [
            'items' => collect($paginator->items())->map(function ($channel) {
                $payload = (new ChannelResource($channel))->resolve();
                $payload['user'] = $channel->user ? [
                    'id' => $channel->user->user_id,
                    'name' => $channel->user->nama,
                    'email' => $channel->user->email,
                ] : null;
                $payload['followers_count'] = $channel->subscriber_count ?? 0;
                $payload['videos_count'] = $channel->videos_count ?? $channel->video_count ?? 0;

                return $payload;
            }),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }
}
