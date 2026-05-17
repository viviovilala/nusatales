<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Test User',
            'email' => 'register@example.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'token',
                    'user',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'register@example.test',
            'role' => 'user',
        ]);
    }

    public function test_registered_password_is_hashed(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Hash User',
            'email' => 'hash@example.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertCreated();

        $user = User::query()->where('email', 'hash@example.test')->firstOrFail();

        $this->assertTrue(Hash::check('Password123!', $user->password));
        $this->assertNotSame('Password123!', $user->password);
    }

    public function test_registered_user_can_login(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Login User',
            'email' => 'registered-login@example.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertCreated();

        $this->postJson('/api/v1/auth/login', [
            'email' => 'registered-login@example.test',
            'password' => 'Password123!',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'token',
                    'user',
                ],
            ]);
    }

    public function test_public_register_cannot_create_admin(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Not Admin',
            'email' => 'not-admin@example.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'admin',
        ])->assertCreated();

        $this->assertDatabaseHas('users', [
            'email' => 'not-admin@example.test',
            'role' => 'user',
        ]);
    }

    public function test_login_returns_token(): void
    {
        User::factory()->create([
            'email' => 'token@example.test',
            'password' => Hash::make('Password123!'),
            'role' => 'user',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'token@example.test',
            'password' => 'Password123!',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'token',
                    'user',
                ],
            ]);
    }

    public function test_auth_me_returns_user(): void
    {
        User::factory()->create([
            'email' => 'me@example.test',
            'password' => Hash::make('Password123!'),
            'role' => 'user',
        ]);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => 'me@example.test',
            'password' => 'Password123!',
        ])->assertOk();

        $this->withToken($login->json('data.token'))
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'user',
                ],
            ])
            ->assertJsonPath('data.user.email', 'me@example.test');
    }

    public function test_wrong_password_returns_validation_error_json(): void
    {
        User::factory()->create([
            'email' => 'wrong-password@example.test',
            'password' => Hash::make('Password123!'),
            'role' => 'user',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'wrong-password@example.test',
            'password' => 'wrong-password',
        ])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['email'])
            ->assertJsonPath('message', 'Email atau password salah.');
    }
}
