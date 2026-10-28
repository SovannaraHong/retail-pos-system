<?php

use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:api')->group(function () {
    Route::get('users', [UserController::class, 'index'])
        ->middleware('permission:users.view,api');

    Route::get('users/{user}', [UserController::class, 'show'])
        ->middleware('permission:users.view,api');

    Route::post('users', [UserController::class, 'store'])
        ->middleware('permission:users.create,api');

    Route::match(['put', 'patch'], 'users/{user}', [UserController::class, 'update'])
        ->middleware('permission:users.update,api');

    Route::delete('users/{user}', [UserController::class, 'destroy'])
        ->middleware('permission:users.delete,api');

    Route::post('users/{id}/restore', [UserController::class, 'restore'])
        ->middleware('permission:users.delete,api');

    Route::delete('users/{id}/force', [UserController::class, 'forceDelete'])
        ->middleware('permission:users.delete,api');
});
