<?php

namespace App\Http\Controllers\Api;

use App\Services\CreatorDashboardService;
use Illuminate\Http\Request;

class CreatorDashboardController extends Controller
{
    public function __construct(
        protected CreatorDashboardService $creatorDashboardService
    ) {
    }

    public function index(Request $request)
    {
        return $this->successResponse(
            'Creator dashboard statistics retrieved successfully.',
            $this->creatorDashboardService->summary($request->user())
        );
    }
}
