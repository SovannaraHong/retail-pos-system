<?php

use App\Http\Controllers\Api\SaleController;
use Illuminate\Support\Facades\Route;

Route::get('sales', [SaleController::class, 'index'])->middleware('permission:sales.view,api');
Route::get('sales/{sale}', [SaleController::class, 'show'])->middleware('permission:sales.view,api');
Route::post('sales', [SaleController::class, 'store'])->middleware('permission:sales.create,api');
Route::post('sales/{id}/void', [SaleController::class, 'void'])->middleware('permission:sales.void,api');
