<?php

use App\Http\Controllers\Api\KhqrPaymentController;
use Illuminate\Support\Facades\Route;

Route::get('khqr/payments', [KhqrPaymentController::class, 'index'])->middleware('permission:reports.view,api');
Route::post('khqr/payments', [KhqrPaymentController::class, 'store'])->middleware('permission:sales.create,api');
Route::get('khqr/payments/{payment}', [KhqrPaymentController::class, 'show'])->middleware(['permission:sales.create,api', 'throttle:120,1']);
Route::post('khqr/payments/{id}/cancel', [KhqrPaymentController::class, 'cancel'])->middleware('permission:sales.create,api');
