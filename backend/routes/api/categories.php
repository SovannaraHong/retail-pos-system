<?php

use App\Http\Controllers\Api\CategoryController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:api')->group(function () {
    Route::get('categories', [CategoryController::class, 'index'])
        ->middleware('permission:categories.view,api');

    Route::get('categories/{category}', [CategoryController::class, 'show'])
        ->middleware('permission:categories.view,api');

    Route::post('categories', [CategoryController::class, 'store'])
        ->middleware('permission:categories.create,api');

    Route::match(['put', 'patch'], 'categories/{category}', [CategoryController::class, 'update'])
        ->middleware('permission:categories.update,api');

    Route::delete('categories/{category}', [CategoryController::class, 'destroy'])
        ->middleware('permission:categories.delete,api');

    Route::post('categories/{id}/restore', [CategoryController::class, 'restore'])
        ->middleware('permission:categories.delete,api');
});
