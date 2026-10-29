<?php

use App\Http\Controllers\Api\StockController;
use Illuminate\Support\Facades\Route;

Route::get('stock/movements', [StockController::class, 'movements'])->middleware('permission:stock.view,api');
Route::post('stock/adjust', [StockController::class, 'adjust'])->middleware('permission:stock.adjust,api');
