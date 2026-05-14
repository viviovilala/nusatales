<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Rating\StoreRatingRequest;
use App\Http\Resources\RatingResource;
use App\Services\CatalogService;

class RatingController extends Controller
{
    public function __construct(
        protected CatalogService $catalogService
    ) {
    }

    public function store(StoreRatingRequest $request)
    {
        $rating = $this->catalogService->rate($request->user(), $request->validated());

        return $this->successResponse(
            'Rating saved successfully.',
            new RatingResource($rating),
            201
        );
    }
}

