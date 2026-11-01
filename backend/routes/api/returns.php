<?php

use App\Http\Controllers\Api\SaleReturnController;
use Illuminate\Support\Facades\Route;

Route::get('returns', [SaleReturnController::class, 'index'])->middleware('permission:sales.refund,api');
Route::get('returns/{saleReturn}', [SaleReturnController::class, 'show'])->middleware('permission:sales.refund,api');
Route::get('sales/{id}/returnable', [SaleReturnController::class, 'returnable'])->middleware('permission:sales.refund,api');
Route::post('sales/{id}/returns', [SaleReturnController::class, 'store'])->middleware('permission:sales.refund,api');
