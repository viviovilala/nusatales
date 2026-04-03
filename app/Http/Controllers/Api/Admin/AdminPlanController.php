<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Controller;
use App\Http\Requests\Admin\StoreSubscriptionPlanRequest;
use App\Http\Requests\Admin\UpdateSubscriptionPlanRequest;
use App\Http\Resources\SubscriptionPlanResource;
use App\Models\SubscriptionPlan;
use App\Services\AdminCatalogService;
use Illuminate\Http\Request;

class AdminPlanController extends Controller
{
    public function __construct(
        protected AdminCatalogService $adminCatalogService
    ) {
    }

    public function index(Request $request)
    {
        $paginator = $this->adminCatalogService->plans((int) $request->integer('per_page', 15));

        return $this->paginatedResponse(
            'Subscription plans retrieved successfully.',
            $paginator,
            SubscriptionPlanResource::collection($paginator)
        );
    }

    public function store(StoreSubscriptionPlanRequest $request)
    {
        $plan = $this->adminCatalogService->createPlan($request->validated());

        return $this->successResponse('Subscription plan created successfully.', new SubscriptionPlanResource($plan), 201);
    }

    public function show(SubscriptionPlan $plan)
    {
        return $this->successResponse('Subscription plan retrieved successfully.', new SubscriptionPlanResource($plan));
    }

    public function update(UpdateSubscriptionPlanRequest $request, SubscriptionPlan $plan)
    {
        $updated = $this->adminCatalogService->updatePlan($plan, $request->validated());

        return $this->successResponse('Subscription plan updated successfully.', new SubscriptionPlanResource($updated));
    }

    public function destroy(SubscriptionPlan $plan)
    {
        $this->adminCatalogService->deletePlan($plan);

        return $this->successResponse('Subscription plan deleted successfully.', null);
    }
}
