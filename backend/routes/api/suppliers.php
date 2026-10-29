<?php

use App\Http\Controllers\Api\SupplierController;
use Illuminate\Support\Facades\Route;

Route::get('suppliers', [SupplierController::class, 'index'])->middleware('permission:suppliers.view,api');
Route::get('suppliers/{supplier}', [SupplierController::class, 'show'])->middleware('permission:suppliers.view,api');
Route::post('suppliers', [SupplierController::class, 'store'])->middleware('permission:suppliers.create,api');
Route::match(['put', 'patch'], 'suppliers/{supplier}', [SupplierController::class, 'update'])->middleware('permission:suppliers.update,api');
Route::delete('suppliers/{supplier}', [SupplierController::class, 'destroy'])->middleware('permission:suppliers.delete,api');
Route::post('suppliers/{id}/restore', [SupplierController::class, 'restore'])->middleware('permission:suppliers.delete,api');
