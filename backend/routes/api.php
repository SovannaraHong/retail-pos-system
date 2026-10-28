<?php

use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    require __DIR__ . '/api/auth.php';
    require __DIR__ . '/api/users.php';
    require __DIR__ . '/api/roles.php';
    require __DIR__ . '/api/permissions.php';
    require __DIR__ . '/api/categories.php';
    require __DIR__ . '/api/products.php';
    require __DIR__ . '/api/brands.php';
});
