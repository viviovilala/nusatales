<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Video\IndexVideoRequest;
use App\Http\Requests\Video\StoreVideoRequest;
use App\Http\Requests\Video\UpdateVideoRequest;
use App\Http\Resources\VideoResource;
use App\Services\VideoService;
use Illuminate\Http\Request;

class CreatorVideoController extends Controller
{
    public function __construct(
        protected VideoService $videoService
    ) {
    }

    public function index(IndexVideoRequest $request)
    {
        $paginator = $this->videoService->paginateForCreator($request->user(), $request->validated());

        return $this->paginatedResponse(
            'Creator animations retrieved successfully.',
            $paginator,
            VideoResource::collection($paginator)
        );
    }

    public function store(StoreVideoRequest $request)
    {
        $video = $this->videoService->create($request->user(), $request->validated());

        return $this->successResponse('Animation uploaded successfully.', new VideoResource($video), 201);
    }

    public function show(Request $request, int $video)
    {
        $record = $this->videoService->findCreatorVideoOrFail($request->user(), $video);

        return $this->successResponse('Animation retrieved successfully.', new VideoResource($record));
    }

    public function update(UpdateVideoRequest $request, int $video)
    {
        $record = $this->videoService->findCreatorVideoOrFail($request->user(), $video);
        $updated = $this->videoService->update($record, $request->validated());

        return $this->successResponse('Animation updated successfully.', new VideoResource($updated));
    }

    public function destroy(Request $request, int $video)
    {
        $record = $this->videoService->findCreatorVideoOrFail($request->user(), $video);
        $this->videoService->delete($record);

        return $this->successResponse('Animation deleted successfully.', null);
    }
}
