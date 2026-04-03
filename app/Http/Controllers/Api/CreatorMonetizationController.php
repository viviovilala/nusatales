<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\EarningResource;
use App\Services\MonetizationService;
use Illuminate\Http\Request;

class CreatorMonetizationController extends Controller
{
    public function __construct(
        protected MonetizationService $monetizationService
    ) {
    }

    public function summary(Request $request)
    {
        return $this->successResponse(
            'Monetization summary retrieved successfully.',
            $this->monetizationService->summary($request->user())
        );
    }

    public function earnings(Request $request)
    {
        $paginator = $this->monetizationService->paginate($request->user(), (int) $request->integer('per_page', 15));

        return $this->paginatedResponse(
            'Earnings retrieved successfully.',
            $paginator,
            EarningResource::collection($paginator)
        );
    }
}
