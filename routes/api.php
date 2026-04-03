<?php

use Illuminate\Support\Facades\Route;

Route::get('/test', function () {
    return response()->json([
        'message' => 'API Laravel jalan',
    ]);
});

require __DIR__ . '/api_v1.php';
