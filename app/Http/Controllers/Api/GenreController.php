<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\GenreResource;
use App\Services\CatalogService;

class GenreController extends Controller
{
    public function __construct(
        protected CatalogService $catalogService
    ) {
    }

    public function index()
    {
        return $this->successResponse(
            'Genres retrieved successfully.',
            GenreResource::collection($this->catalogService->genres())
        );
    }
}

