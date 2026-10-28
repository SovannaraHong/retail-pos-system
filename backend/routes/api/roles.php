<?php

use App\Http\Controllers\Api\RoleController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:api')->group(function () {
    Route::get('roles', [RoleController::class, 'index'])
        ->middleware('permission:roles.view,api');

    Route::get('roles/{role}', [RoleController::class, 'show'])
        ->middleware('permission:roles.view,api');

    Route::post('roles', [RoleController::class, 'store'])
        ->middleware('permission:roles.create,api');

    Route::put('roles/{role}', [RoleController::class, 'update'])
        ->middleware('permission:roles.update,api');

    Route::delete('roles/{role}', [RoleController::class, 'destroy'])
        ->middleware('permission:roles.delete,api');
});
