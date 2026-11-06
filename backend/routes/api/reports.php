<?php

use App\Http\Controllers\Api\ReportController;
use Illuminate\Support\Facades\Route;

Route::prefix('reports')->middleware('permission:reports.view,api')->group(function () {
    Route::get('summary', [ReportController::class, 'summary']);
    Route::get('daily', [ReportController::class, 'daily']);
    Route::get('top-products', [ReportController::class, 'topProducts']);
    Route::get('cashiers', [ReportController::class, 'cashiers']);
    Route::get('low-stock', [ReportController::class, 'lowStock']);
    Route::get('stock-value', [ReportController::class, 'stockValue']);

    // new
    Route::get('hourly', [ReportController::class, 'hourly']);
    Route::get('categories', [ReportController::class, 'categories']);
    Route::get('customers', [ReportController::class, 'customers']);
    Route::get('expenses', [ReportController::class, 'expenses']);
    Route::get('recent-sales', [ReportController::class, 'recentSales']);
});
