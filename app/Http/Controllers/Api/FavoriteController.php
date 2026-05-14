<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Favorite\StoreFavoriteRequest;
use App\Http\Resources\FavoriteResource;
use App\Services\CatalogService;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function __construct(
        protected CatalogService $catalogService
    ) {
    }

    public function index(Request $request)
    {
        $paginator = $this->catalogService->paginateFavorites($request->user(), (int) $request->integer('per_page', 15));

        return $this->paginatedResponse(
            'Favorites retrieved successfully.',
            $paginator,
            FavoriteResource::collection($paginator)
        );
    }

    public function store(StoreFavoriteRequest $request)
    {
        $favorite = $this->catalogService->favorite($request->user(), $request->validated());

        return $this->successResponse(
            'Favorite saved successfully.',
            new FavoriteResource($favorite),
            201
        );
    }

    public function destroy(Request $request, int $favorite)
    {
        $this->catalogService->removeFavorite($request->user(), $favorite);

        return $this->successResponse('Favorite removed successfully.', null);
    }
}

