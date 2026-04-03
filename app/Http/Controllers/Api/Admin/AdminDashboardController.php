<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Controller;
use App\Services\AdminService;

class AdminDashboardController extends Controller
{
    public function __construct(
        protected AdminService $adminService
    ) {
    }

    public function index()
    {
        return $this->successResponse(
            'Dashboard statistics retrieved successfully.',
            $this->adminService->dashboardStats()
        );
    }
}
