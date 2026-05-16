<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\ChannelResource;
use App\Services\ChannelService;
use Illuminate\Http\Request;

class StudioController extends Controller
{
    public function __construct(
        protected ChannelService $channelService
    ) {
    }

    public function status(Request $request)
    {
        $channel = $request->user()->channel()->first();

        return $this->successResponse('Status Studio NusaKarya berhasil dimuat.', [
            'has_channel' => (bool) $channel,
            'can_upload' => (bool) $channel && $channel->status === 'active',
            'can_monetize' => $channel?->monetization_status === 'active',
            'channel' => $channel ? new ChannelResource($channel) : null,
        ]);
    }

    public function activate(Request $request)
    {
        $channel = $this->channelService->activateStudio($request->user());

        return $this->successResponse('Studio NusaKarya berhasil diaktifkan.', [
            'channel' => new ChannelResource($channel),
        ], 201);
    }
}
