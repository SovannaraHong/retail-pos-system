<?php

use App\Http\Controllers\Api\BrandController;
use Illuminate\Support\Facades\Route;

Route::get('brands', [BrandController::class, 'index'])->middleware('permission:brands.view,api');
Route::get('brands/{brand}', [BrandController::class, 'show'])->middleware('permission:brands.view,api');
Route::post('brands', [BrandController::class, 'store'])->middleware('permission:brands.create,api');
Route::match(['put', 'patch'], 'brands/{brand}', [BrandController::class, 'update'])->middleware('permission:brands.update,api');
Route::delete('brands/{brand}', [BrandController::class, 'destroy'])->middleware('permission:brands.delete,api');
Route::post('brands/{id}/restore', [BrandController::class, 'restore'])->middleware('permission:brands.delete,api');
