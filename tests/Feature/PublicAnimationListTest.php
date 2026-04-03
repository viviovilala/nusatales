<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicAnimationListTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_animation_index_returns_standard_structure(): void
    {
        $response = $this->getJson('/api/v1/animations');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'meta' => [
                    'pagination' => [
                        'current_page',
                        'per_page',
                        'total',
                        'last_page',
                    ],
                ],
            ]);
    }
}
