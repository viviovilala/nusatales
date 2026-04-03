<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Controller;
use App\Http\Requests\Admin\StoreAdRequest;
use App\Http\Requests\Admin\UpdateAdRequest;
use App\Http\Resources\AdResource;
use App\Models\Ad;
use App\Services\AdminCatalogService;
use Illuminate\Http\Request;

class AdminAdController extends Controller
{
    public function __construct(
        protected AdminCatalogService $adminCatalogService
    ) {
    }

    public function index(Request $request)
    {
        $paginator = $this->adminCatalogService->ads((int) $request->integer('per_page', 15));

        return $this->paginatedResponse(
            'Ads retrieved successfully.',
            $paginator,
            AdResource::collection($paginator)
        );
    }

    public function store(StoreAdRequest $request)
    {
        $ad = $this->adminCatalogService->createAd($request->validated());

        return $this->successResponse('Ad created successfully.', new AdResource($ad), 201);
    }

    public function show(Ad $ad)
    {
        return $this->successResponse('Ad retrieved successfully.', new AdResource($ad->load('video')));
    }

    public function update(UpdateAdRequest $request, Ad $ad)
    {
        $updated = $this->adminCatalogService->updateAd($ad, $request->validated());

        return $this->successResponse('Ad updated successfully.', new AdResource($updated));
    }

    public function destroy(Ad $ad)
    {
        $this->adminCatalogService->deleteAd($ad);

        return $this->successResponse('Ad deleted successfully.', null);
    }
}
