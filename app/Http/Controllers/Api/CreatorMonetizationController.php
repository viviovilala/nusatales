<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\EarningResource;
use App\Http\Resources\ChannelResource;
use App\Services\ChannelService;
use App\Services\MonetizationService;
use Illuminate\Http\Request;

class CreatorMonetizationController extends Controller
{
    public function __construct(
        protected MonetizationService $monetizationService,
        protected ChannelService $channelService
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

    public function agree(Request $request)
    {
        $validated = $request->validate([
            'agreed' => ['required', 'accepted'],
        ]);

        $result = $this->monetizationService->agree($request->user(), $request, $this->channelService);

        return $this->successResponse('Perjanjian monetisasi berhasil disetujui.', [
            'agreed' => (bool) $validated['agreed'],
            'agreement_text' => $result['agreement_text'],
            'channel' => new ChannelResource($result['channel']),
        ]);
    }
}
