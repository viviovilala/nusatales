<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller as BaseController;
use App\Support\ApiResponse;

abstract class Controller extends BaseController
{
    use ApiResponse;
}
