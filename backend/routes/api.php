<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// require __DIR__ . '/auth.php';
require __DIR__ . '/brands.php';
// require __DIR__ . '/products.php';
// require __DIR__ . '/categories.php';
// require __DIR__ . '/orders.php';
