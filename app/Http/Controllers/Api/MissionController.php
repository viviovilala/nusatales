<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\UserMissionResource;
use App\Services\MissionService;
use Illuminate\Http\Request;

class MissionController extends Controller
{
    public function __construct(
        protected MissionService $missionService
    ) {
    }

    public function index(Request $request)
    {
        $paginator = $this->missionService->list($request->user(), (int) $request->integer('per_page', 15));

        return $this->paginatedResponse(
            'Daily missions retrieved successfully.',
            $paginator,
            UserMissionResource::collection($paginator)
        );
    }
}
