<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Video\IndexVideoRequest;
use App\Http\Resources\VideoResource;
use App\Models\Video;
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

    public function featured()
    {
        return $this->videoCollection(
            'Featured videos retrieved successfully.',
            $this->publicQuery()->orderByDesc('published_at')->limit(12)->get()
        );
    }

    public function trending()
    {
        return $this->videoCollection(
            'Trending videos retrieved successfully.',
            $this->publicQuery()->orderByDesc('view_count')->orderByDesc('published_at')->limit(12)->get()
        );
    }

    public function latest()
    {
        return $this->videoCollection(
            'Latest videos retrieved successfully.',
            $this->publicQuery()->orderByDesc('published_at')->orderByDesc('tanggal_upload')->limit(12)->get()
        );
    }

    public function recommended()
    {
        return $this->videoCollection(
            'Recommended videos retrieved successfully.',
            $this->publicQuery()->orderByDesc('like_count')->orderByDesc('view_count')->limit(12)->get()
        );
    }

    public function shorts(IndexVideoRequest $request)
    {
        $filters = [
            ...$request->validated(),
            'content_type' => 'short',
        ];
        $paginator = $this->videoService->paginatePublic($filters);

        return $this->paginatedResponse(
            'Short videos retrieved successfully.',
            $paginator,
            VideoResource::collection($paginator)
        );
    }

    public function show(int|string $video)
    {
        $record = $this->videoService->findPublishedVideoOrFail($video);

        return $this->successResponse('Animation retrieved successfully.', new VideoResource($record));
    }

    protected function publicQuery()
    {
        return Video::query()
            ->with(['creator.channel', 'channel', 'category', 'genres', 'region', 'series', 'analytics'])
            ->withCount(['likes', 'comments', 'shares'])
            ->published()
            ->publiclyVisible();
    }

    protected function videoCollection(string $message, $videos)
    {
        return $this->successResponse($message, VideoResource::collection($videos)->resolve());
    }
}
