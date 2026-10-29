<?php

use App\Http\Controllers\Api\PurchaseController;
use Illuminate\Support\Facades\Route;

Route::get('purchases', [PurchaseController::class, 'index'])->middleware('permission:purchases.view,api');
Route::get('purchases/{purchase}', [PurchaseController::class, 'show'])->middleware('permission:purchases.view,api');
Route::post('purchases', [PurchaseController::class, 'store'])->middleware('permission:purchases.create,api');
Route::post('purchases/{id}/receive', [PurchaseController::class, 'receive'])->middleware('permission:purchases.update,api');
Route::post('purchases/{id}/cancel', [PurchaseController::class, 'cancel'])->middleware('permission:purchases.update,api');
