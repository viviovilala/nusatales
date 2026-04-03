<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Controller;
use App\Http\Requests\Admin\StoreMissionRequest;
use App\Http\Requests\Admin\UpdateMissionRequest;
use App\Models\DailyMission;
use App\Services\AdminCatalogService;
use Illuminate\Http\Request;

class AdminMissionController extends Controller
{
    public function __construct(
        protected AdminCatalogService $adminCatalogService
    ) {
    }

    public function index(Request $request)
    {
        $paginator = $this->adminCatalogService->missions((int) $request->integer('per_page', 15));

        return $this->successResponse('Daily missions retrieved successfully.', [
            'items' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function store(StoreMissionRequest $request)
    {
        $mission = $this->adminCatalogService->createMission($request->validated());

        return $this->successResponse('Daily mission created successfully.', $mission, 201);
    }

    public function show(DailyMission $mission)
    {
        return $this->successResponse('Daily mission retrieved successfully.', $mission);
    }

    public function update(UpdateMissionRequest $request, DailyMission $mission)
    {
        $updated = $this->adminCatalogService->updateMission($mission, $request->validated());

        return $this->successResponse('Daily mission updated successfully.', $updated);
    }

    public function destroy(DailyMission $mission)
    {
        $this->adminCatalogService->deleteMission($mission);

        return $this->successResponse('Daily mission deleted successfully.', null);
    }
}
