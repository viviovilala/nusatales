<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Series\IndexSeriesRequest;
use App\Http\Resources\SeriesResource;
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
}

