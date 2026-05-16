<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Series\IndexSeriesRequest;
use App\Http\Resources\EpisodeResource;
use App\Http\Resources\SeriesResource;
use App\Models\Episode;
use App\Models\Series;
use App\Services\CatalogService;

class SeriesController extends Controller
{
    public function __construct(
        protected CatalogService $catalogService
    ) {
    }

    public function index(IndexSeriesRequest $request)
    {
        $paginator = $this->catalogService->paginateSeries($request->validated());

        return $this->paginatedResponse(
            'Series retrieved successfully.',
            $paginator,
            SeriesResource::collection($paginator)
        );
    }

    public function show(string $slug)
    {
        return $this->successResponse(
            'Series retrieved successfully.',
            new SeriesResource($this->catalogService->findPublishedSeriesBySlug($slug))
        );
    }

    public function popular()
    {
        $series = Series::query()
            ->with(['creator', 'category', 'genres'])
            ->withCount('publishedEpisodes')
            ->published()
            ->orderByDesc('is_featured')
            ->orderByDesc('published_episodes_count')
            ->limit(12)
            ->get();

        return $this->successResponse('Popular series retrieved successfully.', SeriesResource::collection($series)->resolve());
    }

    public function episodes(string $slug)
    {
        $series = Series::query()->published()->where('slug', $slug)->firstOrFail();
        $episodes = Episode::query()
            ->where('series_id', $series->series_id)
            ->published()
            ->orderBy('episode_number')
            ->get();

        return $this->successResponse('Series episodes retrieved successfully.', EpisodeResource::collection($episodes)->resolve());
    }
}
