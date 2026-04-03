<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Controller;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AdminService;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function __construct(
        protected AdminService $adminService
    ) {
    }

    public function index(Request $request)
    {
        $paginator = $this->adminService->userList($request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'role' => ['nullable', 'in:user,kreator,admin'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]));

        return $this->paginatedResponse(
            'Users retrieved successfully.',
            $paginator,
            UserResource::collection($paginator)
        );
    }

    public function show(User $user)
    {
        return $this->successResponse('User retrieved successfully.', new UserResource($user));
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $updated = $this->adminService->updateUser($user, $request->validated());

        return $this->successResponse('User updated successfully.', new UserResource($updated));
    }

    public function destroy(User $user)
    {
        $this->adminService->deleteUser($user);

        return $this->successResponse('User deleted successfully.', null);
    }
}
