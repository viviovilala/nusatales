<?php

use Illuminate\Support\Facades\Route;

Route::view('/', 'welcome');
Route::view('/{path}', 'welcome')->where('path', '.*');
