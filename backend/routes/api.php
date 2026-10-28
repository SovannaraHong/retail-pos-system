<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// ---------- Public ----------
Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1');
// refresh stays OUTSIDE auth:api so an expired (but refreshable) token still works
Route::post('refresh', [AuthController::class, 'refresh']);

// -----Any Logged in user---------------
Route::middleware('auth:api')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);
});

// protected by permission ---------------

Route::middleware('auth:api')->group(function () {

    //user
    Route::get('users', [UserController::class, 'index'])
        ->middleware('permission:users.view,api');
    Route::get('users/{user}', [UserController::class, 'show'])->middleware('permission:users.view,api');
    Route::post('users', [UserController::class, 'store'])->middleware('permission:users.create,api');
    Route::match(['put', 'patch'], 'users/{user}', [UserController::class, 'update'])->middleware('permission:users.update,api');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->middleware('permission:users.delete,api');
    Route::post('users/{id}/restore', [UserController::class, 'restore'])->middleware('permission:users.delete,api');
    Route::delete('users/{id}/force', [UserController::class, 'forceDelete'])->middleware('permission:users.delete,api');

    // Roles
    Route::get('roles', [RoleController::class, 'index'])->middleware('permission:roles.view,api');
    Route::get('roles/{role}', [RoleController::class, 'show'])->middleware('permission:roles.view,api');
    Route::post('roles', [RoleController::class, 'store'])->middleware('permission:roles.create,api');
    Route::put('roles/{role}', [RoleController::class, 'update'])->middleware('permission:roles.update,api');
    Route::delete('roles/{role}', [RoleController::class, 'destroy'])->middleware('permission:roles.delete,api');


    // Permissions
    Route::get('permissions', [PermissionController::class, 'index'])->middleware('permission:permissions.view,api');
    Route::get('permissions/{permission}', [PermissionController::class, 'show'])->middleware('permission:permissions.view,api');
    Route::post('permissions', [PermissionController::class, 'store'])->middleware('permission:permissions.create,api');
    Route::put('permissions/{permission}', [PermissionController::class, 'update'])->middleware('permission:permissions.update,api');
    Route::delete('permissions/{permission}', [PermissionController::class, 'destroy'])->middleware('permission:permissions.delete,api');



    // Categories
    Route::get('categories', [CategoryController::class, 'index'])->middleware('permission:categories.view,api');
    Route::get('categories/{category}', [CategoryController::class, 'show'])->middleware('permission:categories.view,api');
    Route::post('categories', [CategoryController::class, 'store'])->middleware('permission:categories.create,api');
    Route::match(['put', 'patch'], 'categories/{category}', [CategoryController::class, 'update'])->middleware('permission:categories.update,api');
    Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->middleware('permission:categories.delete,api');
    Route::post('categories/{id}/restore', [CategoryController::class, 'restore'])->middleware('permission:categories.delete,api');
});
