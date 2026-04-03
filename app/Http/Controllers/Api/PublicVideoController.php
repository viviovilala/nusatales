<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Video\IndexVideoRequest;
use App\Http\Resources\VideoResource;
use App\Services\VideoService;

class PublicVideoController extends Controller
{
    public function __construct(
        protected VideoService $videoService
    ) {
    }

    public function index(IndexVideoRequest $request)
    {
        $paginator = $this->videoService->paginatePublic($request->validated());

        return $this->paginatedResponse(
            'Published animations retrieved successfully.',
            $paginator,
            VideoResource::collection($paginator)
        );
    }

    public function show(int $video)
    {
        $record = $this->videoService->findPublishedVideoOrFail($video);

        return $this->successResponse('Animation retrieved successfully.', new VideoResource($record));
    }
}
