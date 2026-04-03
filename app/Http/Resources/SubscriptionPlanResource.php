<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubscriptionPlanResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->plan_id,
            'name' => $this->name,
            'description' => $this->description,
            'price' => (float) $this->price,
            'duration_days' => $this->duration_days,
            'status' => $this->status,
        ];
    }
}
