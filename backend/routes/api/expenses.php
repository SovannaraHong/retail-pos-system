<?php

use App\Http\Controllers\Api\ExpenseController;
use Illuminate\Support\Facades\Route;

Route::get('expenses/categories', [ExpenseController::class, 'categories'])->middleware('permission:expenses.view,api');
Route::get('expenses', [ExpenseController::class, 'index'])->middleware('permission:expenses.view,api');
Route::get('expenses/{expense}', [ExpenseController::class, 'show'])->middleware('permission:expenses.view,api');
Route::post('expenses', [ExpenseController::class, 'store'])->middleware('permission:expenses.create,api');
Route::match(['put', 'patch'], 'expenses/{expense}', [ExpenseController::class, 'update'])->middleware('permission:expenses.create,api');
Route::delete('expenses/{expense}', [ExpenseController::class, 'destroy'])->middleware('permission:expenses.delete,api');
Route::post('expenses/{id}/restore', [ExpenseController::class, 'restore'])->middleware('permission:expenses.delete,api');
