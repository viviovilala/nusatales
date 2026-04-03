<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Interaction\StoreWatchHistoryRequest;
use App\Http\Resources\VideoResource;
use App\Models\User;
use App\Services\CommunityService;
use App\Services\MissionService;
use App\Services\VideoService;
use Illuminate\Http\Request;

class CommunityController extends Controller
{
    public function __construct(
        protected CommunityService $communityService,
        protected VideoService $videoService,
        protected MissionService $missionService
    ) {
    }

    public function follow(Request $request, User $creator)
    {
        $result = $this->communityService->toggleFollow($request->user(), $creator);

        return $this->successResponse('Follow state updated successfully.', $result);
    }

    public function storeWatchHistory(StoreWatchHistoryRequest $request, int $video)
    {
        $record = $this->videoService->findPublishedVideoOrFail($video);
        $history = $this->communityService->recordWatchHistory(
            $request->user(),
            $record,
            $request->validated()['durasi_tonton']
        );

        $this->missionService->progress($request->user(), 'watch');

        return $this->successResponse('Watch history recorded successfully.', [
            'id' => $history->history_id,
            'watched_duration' => $history->durasi_tonton,
        ], 201);
    }

    public function history(Request $request)
    {
        $paginator = $this->communityService->watchHistory($request->user(), (int) $request->integer('per_page', 15));

        return $this->successResponse('Watch history retrieved successfully.', [
            'items' => collect($paginator->items())->map(fn ($history) => [
                'id' => $history->history_id,
                'watched_duration' => $history->durasi_tonton,
                'watched_at' => optional($history->waktu_tonton)->toISOString(),
                'video' => $history->video ? (new VideoResource($history->video))->resolve() : null,
            ]),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }
}
