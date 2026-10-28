<?php

use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:api')->group(function () {
    // Put the specific barcode route before the dynamic product route.
    Route::get('products/barcode/{code}', [ProductController::class, 'findByCode'])
        ->middleware('permission:products.view,api');

    Route::get('products', [ProductController::class, 'index'])
        ->middleware('permission:products.view,api');

    Route::post('products', [ProductController::class, 'store'])
        ->middleware('permission:products.create,api');

    Route::get('products/{product}', [ProductController::class, 'show'])
        ->middleware('permission:products.view,api');

    Route::match(['put', 'patch'], 'products/{product}', [ProductController::class, 'update'])
        ->middleware('permission:products.update,api');

    Route::delete('products/{product}', [ProductController::class, 'destroy'])
        ->middleware('permission:products.delete,api');

    Route::post('products/{id}/restore', [ProductController::class, 'restore'])
        ->middleware('permission:products.delete,api');
});
