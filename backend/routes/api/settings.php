<?php

use App\Http\Controllers\Api\SettingController;
use Illuminate\Support\Facades\Route;

Route::get('settings/receipt', [SettingController::class, 'receipt']);   // any logged-in user
Route::get('settings', [SettingController::class, 'index'])->middleware('permission:settings.view,api');
Route::put('settings', [SettingController::class, 'update'])->middleware('permission:settings.update,api');
