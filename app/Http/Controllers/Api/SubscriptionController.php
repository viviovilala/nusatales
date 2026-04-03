<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Subscription\SubscribeRequest;
use App\Http\Resources\NusaKoinTransactionResource;
use App\Http\Resources\SubscriptionPlanResource;
use App\Http\Resources\UserSubscriptionResource;
use App\Services\SubscriptionService;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function __construct(
        protected SubscriptionService $subscriptionService
    ) {
    }

    public function plans()
    {
        return $this->successResponse(
            'Subscription plans retrieved successfully.',
            SubscriptionPlanResource::collection($this->subscriptionService->plans())
        );
    }

    public function subscribe(SubscribeRequest $request)
    {
        $subscription = $this->subscriptionService->subscribe($request->user(), $request->validated()['plan_id']);

        return $this->successResponse(
            'Subscription activated successfully.',
            new UserSubscriptionResource($subscription),
            201
        );
    }

    public function subscriptions(Request $request)
    {
        $paginator = $this->subscriptionService->subscriptions($request->user(), (int) $request->integer('per_page', 15));

        return $this->paginatedResponse(
            'Subscriptions retrieved successfully.',
            $paginator,
            UserSubscriptionResource::collection($paginator)
        );
    }

    public function transactions(Request $request)
    {
        $paginator = $this->subscriptionService->transactions($request->user(), (int) $request->integer('per_page', 15));

        return $this->paginatedResponse(
            'NusaKoin transactions retrieved successfully.',
            $paginator,
            NusaKoinTransactionResource::collection($paginator)
        );
    }
}
