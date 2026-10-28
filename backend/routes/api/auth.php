<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

// Public authentication routes
Route::post('login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');

Route::post('refresh', [AuthController::class, 'refresh'])
    ->middleware('throttle:10,1');

// Authenticated routes
Route::middleware('auth:api')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);
});
