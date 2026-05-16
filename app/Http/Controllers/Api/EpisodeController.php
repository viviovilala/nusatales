<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Episode\StoreEpisodeProgressRequest;
use App\Http\Resources\EpisodeProgressResource;
use App\Http\Resources\EpisodeResource;
use App\Models\Episode;
use App\Services\CatalogService;
use Illuminate\Http\Request;

class EpisodeController extends Controller
{
    public function __construct(
        protected CatalogService $catalogService
    ) {
    }

    public function show(Request $request, int $episode)
    {
        return $this->successResponse(
            'Episode retrieved successfully.',
            new EpisodeResource($this->catalogService->findPublishedEpisode($episode, $request->user()))
        );
    }

    public function latest()
    {
        $episodes = Episode::query()
            ->with(['series.creator', 'series.category', 'series.genres'])
            ->whereHas('series', fn ($query) => $query->published())
            ->published()
            ->orderByDesc('published_at')
            ->limit(12)
            ->get();

        return $this->successResponse('Latest episodes retrieved successfully.', EpisodeResource::collection($episodes)->resolve());
    }

    public function storeProgress(StoreEpisodeProgressRequest $request, int $episode)
    {
        $record = $this->catalogService->findPublishedEpisode($episode, $request->user());
        $progress = $this->catalogService->recordEpisodeProgress($request->user(), $record, $request->validated());

        return $this->successResponse(
            'Episode progress saved successfully.',
            new EpisodeProgressResource($progress),
            201
        );
    }

    public function continueWatching(Request $request)
    {
        $paginator = $this->catalogService->continueWatching($request->user(), (int) $request->integer('per_page', 15));

        return $this->paginatedResponse(
            'Continue watching progress retrieved successfully.',
            $paginator,
            EpisodeProgressResource::collection($paginator)
        );
    }
}
