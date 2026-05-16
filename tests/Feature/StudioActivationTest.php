<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StudioActivationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_activate_studio(): void
    {
        $this->postJson('/api/v1/creator/activate-studio')
            ->assertUnauthorized()
            ->assertJsonPath('success', false);
    }

    public function test_user_can_activate_studio_without_role_change(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/creator/activate-studio')
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Studio NusaKarya berhasil diaktifkan.')
            ->assertJsonPath('data.channel.user_id', $user->user_id);

        $user->refresh();

        $this->assertSame('user', $user->role);
        $this->assertDatabaseHas('channels', [
            'id' => $response->json('data.channel.id'),
            'user_id' => $user->user_id,
            'status' => 'active',
        ]);
    }

    public function test_studio_activation_is_idempotent(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        Sanctum::actingAs($user);

        $first = $this->postJson('/api/v1/creator/activate-studio')->json('data.channel.id');
        $second = $this->postJson('/api/v1/creator/activate-studio')->json('data.channel.id');

        $this->assertSame($first, $second);
        $this->assertDatabaseCount('channels', 1);
    }

    public function test_studio_status_reports_channel_capabilities(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/creator/studio-status')
            ->assertOk()
            ->assertJsonPath('data.has_channel', false)
            ->assertJsonPath('data.can_upload', false);

        $this->postJson('/api/v1/creator/activate-studio');

        $this->getJson('/api/v1/creator/studio-status')
            ->assertOk()
            ->assertJsonPath('data.has_channel', true)
            ->assertJsonPath('data.can_upload', true)
            ->assertJsonPath('data.can_monetize', false);
    }
}
