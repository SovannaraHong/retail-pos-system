<?php

use App\Http\Controllers\Api\PermissionController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:api')->group(function () {
    Route::get('permissions', [PermissionController::class, 'index'])
        ->middleware('permission:permissions.view,api');

    Route::get('permissions/{permission}', [PermissionController::class, 'show'])
        ->middleware('permission:permissions.view,api');

    Route::post('permissions', [PermissionController::class, 'store'])
        ->middleware('permission:permissions.create,api');

    Route::put('permissions/{permission}', [PermissionController::class, 'update'])
        ->middleware('permission:permissions.update,api');

    Route::delete('permissions/{permission}', [PermissionController::class, 'destroy'])
        ->middleware('permission:permissions.delete,api');
});
