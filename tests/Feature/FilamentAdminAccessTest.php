<?php

namespace Tests\Feature;

use App\Models\User;
use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class FilamentAdminAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Filament::setCurrentPanel('admin');
    }

    public function test_unauthenticated_admin_panel_access_redirects_to_login(): void
    {
        $this->get('/admin')
            ->assertRedirect('/admin/login');
    }

    public function test_admin_is_authorized_for_filament_admin_panel(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->assertTrue($admin->canAccessPanel(Filament::getPanel('admin')));

        $this->actingAs($admin)
            ->get('/admin')
            ->assertOk();
    }

    public function test_user_and_creator_are_not_authorized_for_filament_admin_panel(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $creator = User::factory()->create(['role' => 'creator']);

        $this->assertFalse($user->canAccessPanel(Filament::getPanel('admin')));
        $this->assertFalse($creator->canAccessPanel(Filament::getPanel('admin')));

        $this->actingAs($user)
            ->get('/admin')
            ->assertForbidden();

        auth()->logout();

        $this->actingAs($creator)
            ->get('/admin')
            ->assertForbidden();
    }

    public function test_admin_credentials_can_pass_filament_login_guard(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin@example.test',
            'password' => Hash::make('Password123!'),
            'role' => 'admin',
        ]);

        $authenticated = auth()->attemptWhen([
            'email' => 'admin@example.test',
            'password' => 'Password123!',
        ], fn (User $user): bool => $user->canAccessPanel(Filament::getPanel('admin')));

        $this->assertTrue($authenticated);
        $this->assertAuthenticatedAs($admin);
    }

    public function test_wrong_credentials_fail_filament_login_guard(): void
    {
        User::factory()->create([
            'email' => 'admin@example.test',
            'password' => Hash::make('Password123!'),
            'role' => 'admin',
        ]);

        $authenticated = auth()->attemptWhen([
            'email' => 'admin@example.test',
            'password' => 'wrong-password',
        ], fn (User $user): bool => $user->canAccessPanel(Filament::getPanel('admin')));

        $this->assertFalse($authenticated);
        $this->assertGuest();
    }

    public function test_non_admin_credentials_cannot_pass_filament_login_guard(): void
    {
        User::factory()->create([
            'email' => 'user@example.test',
            'password' => Hash::make('Password123!'),
            'role' => 'user',
        ]);

        $authenticated = auth()->attemptWhen([
            'email' => 'user@example.test',
            'password' => 'Password123!',
        ], fn (User $user): bool => $user->canAccessPanel(Filament::getPanel('admin')));

        $this->assertFalse($authenticated);
        $this->assertGuest();
    }
}
