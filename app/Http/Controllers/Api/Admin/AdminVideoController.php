<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Controller;
use App\Http\Requests\Admin\UpdateVideoStatusRequest;
use App\Http\Requests\Video\IndexVideoRequest;
use App\Http\Resources\VideoResource;
use App\Services\VideoService;

class AdminVideoController extends Controller
{
    public function __construct(
        protected VideoService $videoService
    ) {
    }

    public function index(IndexVideoRequest $request)
    {
        $paginator = $this->videoService->paginateForAdmin($request->validated());

        return $this->paginatedResponse(
            'Animation moderation list retrieved successfully.',
            $paginator,
            VideoResource::collection($paginator)
        );
    }

    public function show(int $video)
    {
        $record = $this->videoService->findAdminVideoOrFail($video);

        return $this->successResponse('Animation retrieved successfully.', new VideoResource($record));
    }

    public function updateStatus(UpdateVideoStatusRequest $request, int $video)
    {
        $payload = $request->validated();
        $record = $this->videoService->findAdminVideoOrFail($video);
        $updated = $this->videoService->updateStatus(
            $record,
            $payload['status'],
            $payload['rejection_reason'] ?? null
        );

        return $this->successResponse('Animation moderation status updated successfully.', new VideoResource($updated));
    }

    public function destroy(int $video)
    {
        $record = $this->videoService->findAdminVideoOrFail($video);
        $this->videoService->delete($record);

        return $this->successResponse('Animation deleted successfully.', null);
    }
}
