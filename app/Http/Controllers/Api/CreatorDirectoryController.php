<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\UserResource;
use App\Services\AdminCatalogService;
use Illuminate\Http\Request;

class CreatorDirectoryController extends Controller
{
    public function __construct(
        protected AdminCatalogService $adminCatalogService
    ) {
    }

    public function index(Request $request)
    {
        $paginator = $this->adminCatalogService->creators(
            (int) $request->integer('per_page', 15),
            $request->string('search')->toString() ?: null
        );

        return $this->successResponse('Creators retrieved successfully.', [
            'items' => collect($paginator->items())->map(function ($creator) {
                $payload = (new UserResource($creator))->resolve();
                $payload['followers_count'] = $creator->followers_count ?? 0;
                $payload['videos_count'] = $creator->videos_count ?? 0;

                return $payload;
            }),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }
}
