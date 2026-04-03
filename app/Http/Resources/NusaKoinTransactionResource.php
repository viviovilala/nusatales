<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NusaKoinTransactionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->transaction_id,
            'type' => $this->type,
            'amount' => $this->amount,
            'source' => $this->source,
            'notes' => $this->notes,
            'created_at' => optional($this->created_at)->toISOString(),
        ];
    }
}
