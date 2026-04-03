<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Notification\MarkNotificationRequest;
use App\Http\Resources\NotificationResource;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        protected NotificationService $notificationService
    ) {
    }

    public function index(Request $request)
    {
        $paginator = $this->notificationService->paginate($request->user(), (int) $request->integer('per_page', 15));

        return $this->paginatedResponse(
            'Notifications retrieved successfully.',
            $paginator,
            NotificationResource::collection($paginator)
        );
    }

    public function updateStatus(MarkNotificationRequest $request, int $notification)
    {
        $record = $this->notificationService->updateStatus(
            $request->user(),
            $notification,
            $request->validated()['status']
        );

        return $this->successResponse('Notification updated successfully.', new NotificationResource($record));
    }

    public function wallet(Request $request)
    {
        return $this->successResponse(
            'Wallet summary retrieved successfully.',
            $this->notificationService->wallet($request->user())
        );
    }
}
