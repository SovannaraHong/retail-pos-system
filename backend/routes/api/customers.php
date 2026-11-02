<?php

use App\Http\Controllers\Api\CustomerController;
use Illuminate\Support\Facades\Route;

Route::get('customers/phone/{phone}', [CustomerController::class, 'findByPhone'])->middleware('permission:customers.view,api');
Route::get('customers', [CustomerController::class, 'index'])->middleware('permission:customers.view,api');
Route::get('customers/{customer}', [CustomerController::class, 'show'])->middleware('permission:customers.view,api');
Route::post('customers', [CustomerController::class, 'store'])->middleware('permission:customers.create,api');
Route::match(['put', 'patch'], 'customers/{customer}', [CustomerController::class, 'update'])->middleware('permission:customers.update,api');
Route::delete('customers/{customer}', [CustomerController::class, 'destroy'])->middleware('permission:customers.delete,api');
Route::post('customers/{id}/restore', [CustomerController::class, 'restore'])->middleware('permission:customers.delete,api');
