<?php

use App\Http\Controllers\Api\ShiftController;
use Illuminate\Support\Facades\Route;

Route::post('shifts/open', [ShiftController::class, 'open'])->middleware('permission:shifts.open,api');
Route::get('shifts/current', [ShiftController::class, 'current'])->middleware('permission:shifts.open,api');
Route::post('shifts/close', [ShiftController::class, 'close'])->middleware('permission:shifts.close,api');
Route::get('shifts', [ShiftController::class, 'index'])->middleware('permission:shifts.view,api');
Route::get('shifts/{shift}', [ShiftController::class, 'show'])->middleware('permission:shifts.view,api');
