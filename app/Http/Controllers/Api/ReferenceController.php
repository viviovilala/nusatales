<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\CeritaRakyatResource;
use App\Http\Resources\KategoriResource;
use App\Services\ReferenceService;
use Illuminate\Http\Request;

class ReferenceController extends Controller
{
    public function __construct(
        protected ReferenceService $referenceService
    ) {
    }

    public function categories()
    {
        return $this->successResponse(
            'Categories retrieved successfully.',
            KategoriResource::collection($this->referenceService->categories())
        );
    }

    public function stories(Request $request)
    {
        $payload = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
        ]);

        return $this->successResponse(
            'Stories retrieved successfully.',
            CeritaRakyatResource::collection($this->referenceService->stories($payload['search'] ?? null))
        );
    }
}
