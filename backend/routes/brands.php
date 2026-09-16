<?php

use App\Http\Controllers\api\BrandController;
use Illuminate\Support\Facades\Route;

Route::apiResource('brands', BrandController::class);
