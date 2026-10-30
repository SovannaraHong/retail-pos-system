<?php

namespace App\Services;

use App\Models\Payments;
use App\Models\SaleReturns;
use App\Models\Sales;
use App\Models\Shifts;

class ShiftService
{

    public function summary(Shifts $shift): array
    {
        $validSales = fn() => Sales::query()
            ->where('shift_id', $shift->id)
            ->where('status', '!=', 'voided');

        $salesCount = $validSales()->count();

        $salesTotal = round((float)$validSales()->sum('total'), 2);

        $byMethod = Payments::query()
            ->whereIn('sale_id', $validSales()->select('id'))
            ->selectRaw('method, SUM(amount) as total')
            ->groupBy('method')
            ->pluck('total', 'method')
            ->map(fn($v) => round((float)$v, 2));

        $cashSales = (float)($byMethod['cash'] ?? 0);


        $cashRefunds = (float) SaleReturns::query()
            ->where('user_id', $shift->user_id)
            ->where('refund_method', 'cash')
            ->where('returned_at', '>=', $shift->opened_at)
            ->when($shift->closed_at, fn($q) => $q->where('returned_at', '<=', $shift->closed_at))
            ->sum('total_refund');
        return [
            'sales_count'   => $salesCount,
            'sales_total'   => $salesTotal,
            'by_method'     => $byMethod,
            'cash_sales'    => round($cashSales, 2),
            'cash_refunds'  => round($cashRefunds, 2),
            'expected_cash' => round((float) $shift->opening_cash + $cashSales - $cashRefunds, 2),
        ];
    }
}
