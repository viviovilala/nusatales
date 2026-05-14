<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_receive_token(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Nusa Viewer',
            'email' => 'viewer-register@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'admin',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'token',
                    'user' => ['id', 'name', 'email', 'role'],
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'viewer-register@example.test',
            'role' => 'user',
        ]);

        $this->assertTrue(Hash::check('password123', User::query()->where('email', 'viewer-register@example.test')->first()->password));

        $this->postJson('/api/login', [
            'email' => 'viewer-register@example.test',
            'password' => 'password123',
        ])
            ->assertOk()
            ->assertJsonStructure(['data' => ['token', 'user']]);
    }

    public function test_duplicate_email_cannot_register(): void
    {
        User::factory()->create(['email' => 'duplicate@example.test']);

        $this->postJson('/api/register', [
            'name' => 'Duplicate User',
            'email' => 'duplicate@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_login_and_fetch_profile(): void
    {
        $user = User::factory()->create([
            'email' => 'viewer@example.test',
            'password' => Hash::make('password123'),
            'role' => 'user',
        ]);

        $login = $this->postJson('/api/login', [
            'email' => 'viewer@example.test',
            'password' => 'password123',
            'device_name' => 'feature-test',
        ]);

        $login
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['token', 'user']]);

        $token = $login->json('data.token');

        $this->withToken($token)->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.email', 'viewer@example.test');
    }

    public function test_user_can_logout_current_token(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $token = $user->createToken('feature-test')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/logout')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_authenticated_user_can_update_profile(): void
    {
        Storage::fake('public');

        $user = User::factory()->create([
            'nama' => 'Old Name',
            'email' => 'old@example.test',
            'password' => Hash::make('password123'),
        ]);

        Sanctum::actingAs($user);

        $response = $this->post('/api/v1/auth/profile', [
            'nama' => 'New Name',
            'email' => 'new@example.test',
            'current_password' => 'password123',
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
            'foto_profil' => UploadedFile::fake()->image('profile.jpg'),
        ], [
            'Accept' => 'application/json',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'New Name')
            ->assertJsonPath('data.email', 'new@example.test')
            ->assertJsonStructure(['data' => ['profile_photo']]);

        $user->refresh();

        $this->assertTrue(Hash::check('new-password123', $user->password));
        $this->assertDatabaseHas('users', [
            'user_id' => $user->user_id,
            'nama' => 'New Name',
            'email' => 'new@example.test',
        ]);
        Storage::disk('public')->assertExists($user->foto_profil);
    }

    public function test_invalid_login_returns_safe_error_response(): void
    {
        User::factory()->create([
            'email' => 'viewer@example.test',
            'password' => Hash::make('password123'),
        ]);

        $this->postJson('/api/login', [
            'email' => 'viewer@example.test',
            'password' => 'wrong-password',
        ])
            ->assertUnauthorized()
            ->assertJsonPath('success', false)
            ->assertJsonMissingPath('exception')
            ->assertJsonMissingPath('trace');
    }
}
