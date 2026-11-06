<?php

namespace App\Services;

use App\Models\Products;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ReportService
{
    private const COUNTED = ['completed', 'partially_refunded', 'refunded'];

    public function range(?string $from, ?string $to): array
    {
        $today = now()->startOfDay();

        $start = $from
            ? Carbon::parse($from)->startOfDay()
            : ($to ? Carbon::parse($to)->startOfDay() :
                $today->copy());
        $end = $to
            ? Carbon::parse($to)->endOfDay()
            : ($today->greaterThan($start) ? $today->copy() :
                $start->copy()->endOfDay());

        if ($start->diffInDays($end) > 366) {
            throw ValidationException::withMessages([
                'date_to' => ['The date range can be 366 days at most.'],
            ]);
        }
        return [$start, $end];
    }

    public function summary(Carbon $from, Carbon $to): array
    {
        $sales = DB::table('sales')
            ->whereIn('status', self::COUNTED)
            ->whereBetween('sold_at', [$from, $to])
            ->selectRaw('
                        COUNT(*) as cnt,
                        COALESCE(SUM(total), 0) as gross,
                        COALESCE(SUM(tax), 0) as tax,
                        COALESCE(SUM(discount), 0) as discount
                        ')
            ->first();
        $items = DB::table('sale_items as si')
            ->join('sales as s', 's.id', '=', 'si.sale_id')
            ->whereIn('s.status', self::COUNTED)
            ->whereBetween('s.sold_at', [$from, $to])
            ->selectRaw('COALESCE(SUM(si.qty),0) as qty, COALESCE(SUM(si.qty * si.cost_price),0) as cogs')
            ->first();

        $returns = DB::table('sale_returns')
            ->whereBetween('returned_at', [$from, $to])
            ->selectRaw('COUNT(*) as cnt, COALESCE(SUM(total_refund),0) as refunds')
            ->first();
        $returned = $this->returnedGoods($from, $to);

        $voided = DB::table('sales')
            ->where('status', 'voided')
            ->whereBetween('sold_at', [$from, $to])
            ->selectRaw('COUNT(*) as cnt, COALESCE(SUM(total),0) as amount')
            ->first();

        $expenses = (float) DB::table('expenses')
            ->whereNull('deleted_at')
            ->whereBetween('expense_date', [$from->toDateString(), $to->toDateString()])
            ->sum('amount');


        $paidBy = DB::table('payments as p')
            ->join('sales as s', 's.id', '=', 'p.sale_id')
            ->whereIn('s.status', self::COUNTED)
            ->whereBetween('s.sold_at', [$from, $to])
            ->selectRaw('p.method, COUNT(*) as cnt, COALESCE(SUM(p.amount),0) as total')
            ->groupBy('p.method')
            ->orderBy('p.method')
            ->get()
            ->map(fn($r) => ['method' => $r->method, 'payments' => (int) $r->cnt, 'total' => round((float) $r->total, 2)])
            ->values();

        $refundedBy = DB::table('sale_returns')
            ->whereBetween('returned_at', [$from, $to])
            ->selectRaw('refund_method, COUNT(*) as cnt, COALESCE(SUM(total_refund),0) as total')
            ->groupBy('refund_method')
            ->orderBy('refund_method')
            ->get()
            ->map(fn($r) => ['method' => $r->refund_method, 'returns' => (int) $r->cnt, 'total' => round((float) $r->total, 2)])
            ->values();

        $gross      = (float) $sales->gross;
        $tax        = (float) $sales->tax;
        $refunds    = (float) $returns->refunds;
        $netSales   = $gross - $refunds;
        $revenue    = ($gross - $tax) - ($refunds - $returned['refunded_tax']);
        $cogs       = (float) $items->cogs - $returned['restocked_cost'];
        $grossProfit = $revenue - $cogs;
        $netProfit  = $grossProfit - $expenses;


        return [
            'from'  => $from->toDateString(),
            'to'    => $to->toDateString(),
            'sales_count'   => (int) $sales->cnt,
            'items_sold'    => (float) $items->qty,
            'average_sale'  => $sales->cnt > 0 ? round($gross / $sales->cnt, 2) : 0.0,
            'gross_sales'   => round($gross, 2),
            'discounts'     => round((float) $sales->discount, 2),
            'tax_collected' => round($tax, 2),
            'returns_count' => (int) $returns->cnt,
            'refunds'       => round($refunds, 2),
            'net_sales'     => round($netSales, 2),
            'revenue'       => round($revenue, 2),
            'cogs'          => round($cogs, 2),
            'gross_profit'  => round($grossProfit, 2),
            'margin_percent' => $revenue > 0 ? round($grossProfit / $revenue * 100, 1) : 0.0,
            'expenses'      => round($expenses, 2),
            'net_profit'    => round($netProfit, 2),
            'voided_count'  => (int) $voided->cnt,
            'voided_amount' => round((float) $voided->amount, 2),
            'payments_by_method' => $paidBy,
            'refunds_by_method'  => $refundedBy,
        ];
    }


    // ---------------------------------------------------------------- daily (for charts)
    public function daily(Carbon $from, Carbon $to): array
    {
        $sales = DB::table('sales')
            ->whereIn('status', self::COUNTED)
            ->whereBetween('sold_at', [$from, $to])
            ->selectRaw('DATE(sold_at) as d, COUNT(*) as cnt, SUM(total) as gross, SUM(tax) as tax')
            ->groupByRaw('DATE(sold_at)')
            ->get()
            ->keyBy(fn($r) => substr((string) $r->d, 0, 10));

        $cogs = DB::table('sale_items as si')
            ->join('sales as s', 's.id', '=', 'si.sale_id')
            ->whereIn('s.status', self::COUNTED)
            ->whereBetween('s.sold_at', [$from, $to])
            ->selectRaw('DATE(s.sold_at) as d, SUM(si.qty * si.cost_price) as cogs')
            ->groupByRaw('DATE(s.sold_at)')
            ->get()
            ->keyBy(fn($r) => substr((string) $r->d, 0, 10));

        $refunds = DB::table('sale_returns')
            ->whereBetween('returned_at', [$from, $to])
            ->selectRaw('DATE(returned_at) as d, SUM(total_refund) as refunds')
            ->groupByRaw('DATE(returned_at)')
            ->get()
            ->keyBy(fn($r) => substr((string) $r->d, 0, 10));

        $returnedGoods = DB::table('sale_return_items as sri')
            ->join('sale_returns as sr', 'sr.id', '=', 'sri.sale_return_id')
            ->join('sale_items as si', 'si.id', '=', 'sri.sale_item_id')
            ->whereBetween('sr.returned_at', [$from, $to])
            ->selectRaw('DATE(sr.returned_at) as d,
                SUM(CASE WHEN sri.restock THEN sri.qty * si.cost_price ELSE 0 END) as restocked_cost,
                SUM(sri.line_total * si.tax / NULLIF(si.line_total, 0)) as refunded_tax')
            ->groupByRaw('DATE(sr.returned_at)')
            ->get()
            ->keyBy(fn($r) => substr((string) $r->d, 0, 10));

        $expenses = DB::table('expenses')
            ->whereNull('deleted_at')
            ->whereBetween('expense_date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('expense_date as d, SUM(amount) as amount')
            ->groupBy('expense_date')
            ->get()
            ->keyBy(fn($r) => substr((string) $r->d, 0, 10));

        $rows = [];

        // one row for EVERY day, so a chart has no gaps
        for ($day = $from->copy()->startOfDay(); $day->lte($to); $day->addDay()) {
            $key = $day->toDateString();

            $gross    = (float) ($sales[$key]->gross ?? 0);
            $tax      = (float) ($sales[$key]->tax ?? 0);
            $refund   = (float) ($refunds[$key]->refunds ?? 0);
            $revenue  = ($gross - $tax) - ($refund - (float) ($returnedGoods[$key]->refunded_tax ?? 0));
            $dayCogs  = (float) ($cogs[$key]->cogs ?? 0) - (float) ($returnedGoods[$key]->restocked_cost ?? 0);
            $dayExp   = (float) ($expenses[$key]->amount ?? 0);

            $rows[] = [
                'date'         => $key,
                'sales_count'  => (int) ($sales[$key]->cnt ?? 0),
                'gross_sales'  => round($gross, 2),
                'refunds'      => round($refund, 2),
                'net_sales'    => round($gross - $refund, 2),
                'cogs'         => round($dayCogs, 2),
                'gross_profit' => round($revenue - $dayCogs, 2),
                'expenses'     => round($dayExp, 2),
                'net_profit'   => round($revenue - $dayCogs - $dayExp, 2),
            ];
        }

        return $rows;
    }

    // ---------------------------------------------------------------- best sellers
    // public function topProducts(Carbon $from, Carbon $to, int $limit, string $sort): array
    // {
    //     $order = ['qty' => 'qty', 'revenue' => 'revenue', 'profit' => 'profit'][$sort] ?? 'qty';

    //     return DB::table('sale_items as si')
    //         ->join('sales as s', 's.id', '=', 'si.sale_id')
    //         ->whereIn('s.status', self::COUNTED)
    //         ->whereBetween('s.sold_at', [$from, $to])
    //         ->selectRaw('si.product_id, MAX(si.product_name) as name, MAX(si.sku) as sku,
    //             SUM(si.qty) as qty,
    //             SUM(si.line_total - si.tax) as revenue,
    //             SUM(si.line_total - si.tax - si.qty * si.cost_price) as profit')
    //         ->groupBy('si.product_id')
    //         ->orderByRaw($order . ' DESC')
    //         ->limit($limit)
    //         ->get()
    //         ->map(fn($r) => [
    //             'product_id' => (int) $r->product_id,
    //             'name'       => $r->name,
    //             'sku'        => $r->sku,
    //             'qty_sold'   => (float) $r->qty,
    //             'revenue'    => round((float) $r->revenue, 2),   // without tax, before returns
    //             'profit'     => round((float) $r->profit, 2),
    //         ])
    //         ->values()
    //         ->all();
    // }

    public function topProducts(Carbon $from, Carbon $to, int $limit, string $sort): array
    {
        $order = ['qty' => 'qty', 'revenue' => 'revenue', 'profit' => 'profit'][$sort] ?? 'qty';

        return DB::table('sale_items as si')
            ->join('sales as s', 's.id', '=', 'si.sale_id')
            ->leftJoin('products as p', 'p.id', '=', 'si.product_id')
            ->whereIn('s.status', self::COUNTED)
            ->whereBetween('s.sold_at', [$from, $to])
            ->selectRaw('
            si.product_id,
            MAX(si.product_name) as name,
            MAX(si.sku) as sku,
            MAX(p.image) as image,
            SUM(si.qty) as qty,
            SUM(si.line_total - si.tax) as revenue,
            SUM(si.line_total - si.tax - si.qty * si.cost_price) as profit
        ')
            ->groupBy('si.product_id')
            ->orderByRaw($order . ' DESC')
            ->limit($limit)
            ->get()
            ->map(fn($r) => [
                'product_id' => (int) $r->product_id,
                'name'       => $r->name,
                'sku'        => $r->sku,
                'image_url'  => $r->image
                    ? Storage::url($r->image)
                    : null,
                'qty_sold'   => (float) $r->qty,
                'revenue'    => round((float) $r->revenue, 2),
                'profit'     => round((float) $r->profit, 2),
            ])
            ->values()
            ->all();
    }

    // ---------------------------------------------------------------- per cashier
    public function cashiers(Carbon $from, Carbon $to): array
    {
        return DB::table('sales as s')
            ->join('users as u', 'u.id', '=', 's.user_id')
            ->whereIn('s.status', self::COUNTED)
            ->whereBetween('s.sold_at', [$from, $to])
            ->selectRaw('u.id, u.name, COUNT(*) as cnt, SUM(s.total) as gross, SUM(s.discount) as discount')
            ->groupBy('u.id', 'u.name')
            ->orderByRaw('SUM(s.total) DESC')
            ->get()
            ->map(fn($r) => [
                'user_id'      => (int) $r->id,
                'name'         => $r->name,
                'sales_count'  => (int) $r->cnt,
                'gross_sales'  => round((float) $r->gross, 2),
                'average_sale' => $r->cnt > 0 ? round((float) $r->gross / $r->cnt, 2) : 0.0,
                'discounts_given' => round((float) $r->discount, 2),
            ])
            ->values()
            ->all();
    }

    // ---------------------------------------------------------------- stock
    public function lowStock(int $limit): array
    {
        return Products::query()
            ->lowStock()
            ->where('is_active', true)
            ->with('category:id,name')
            ->orderByRaw('(stock_qty - reorder_level) ASC')
            ->limit($limit)
            ->get()
            ->map(fn($p) => [
                'product_id'    => $p->id,
                'name'          => $p->name,
                'sku'           => $p->sku,
                'barcode'       => $p->barcode,
                'category'      => $p->category?->name,
                'unit'          => $p->unit,
                'stock_qty'     => (float) $p->stock_qty,
                'reorder_level' => (float) $p->reorder_level,
                'missing'       => max(0, round((float) $p->reorder_level - (float) $p->stock_qty, 3)),
                'status'        => (float) $p->stock_qty <= 0 ? 'out_of_stock' : 'low',
            ])
            ->values()
            ->all();
    }

    // real number of low-stock products (the list above is limited)
    public function lowStockCount(): int
    {
        return Products::query()->lowStock()->where('is_active', true)->count();
    }

    public function stockValue(): array
    {
        $base = fn() => DB::table('products as p')
            ->whereNull('p.deleted_at')
            ->where('p.is_active', true)
            ->where('p.track_stock', true);

        $total = $base()
            ->where('p.stock_qty', '>', 0)
            ->selectRaw('COUNT(*) as products, COALESCE(SUM(p.stock_qty),0) as units,
                COALESCE(SUM(p.stock_qty * p.cost_price),0) as cost_value,
                COALESCE(SUM(p.stock_qty * p.sell_price),0) as retail_value')
            ->first();

        $byCategory = $base()
            ->leftJoin('categories as c', 'c.id', '=', 'p.category_id')
            ->where('p.stock_qty', '>', 0)
            ->selectRaw('c.id as category_id, c.name as category, COUNT(*) as products,
                COALESCE(SUM(p.stock_qty),0) as units,
                COALESCE(SUM(p.stock_qty * p.cost_price),0) as cost_value,
                COALESCE(SUM(p.stock_qty * p.sell_price),0) as retail_value')
            ->groupBy('c.id', 'c.name')
            ->orderByRaw('SUM(p.stock_qty * p.cost_price) DESC')
            ->get()
            ->map(fn($r) => [
                'category_id'  => $r->category_id,
                'category'     => $r->category ?? 'No category',
                'products'     => (int) $r->products,
                'units'        => (float) $r->units,
                'cost_value'   => round((float) $r->cost_value, 2),
                'retail_value' => round((float) $r->retail_value, 2),
            ])
            ->values()
            ->all();

        return [
            'products_in_stock'    => (int) $total->products,
            'units'                => (float) $total->units,
            'cost_value'           => round((float) $total->cost_value, 2),    // what the stock cost you
            'retail_value'         => round((float) $total->retail_value, 2),  // what it sells for
            'potential_profit'     => round((float) $total->retail_value - (float) $total->cost_value, 2),
            'out_of_stock'         => $base()->where('p.stock_qty', '<=', 0)->count(),
            'negative_stock'       => $base()->where('p.stock_qty', '<', 0)->count(), // sold before the delivery was recorded
            'by_category'          => $byCategory,
        ];
    }


    // =====================================================================
    // NEW: dashboard extras
    // ASSUMED COLUMNS (edit here if yours differ):
    //   sales.customer_id, customers.name, sales.invoice_no (optional)
    //   expenses.expense_category_id, expense_categories.name
    //   products.category_id, categories.name
    // =====================================================================

    // day / week / month for the chart; "auto" picks by range length
    public function resolveGroup(Carbon $from, Carbon $to, string $by): string
    {
        if (in_array($by, ['day', 'week', 'month'], true)) {
            return $by;
        }

        $days = (int) floor($from->diffInDays($to)) + 1;

        return $days <= 31 ? 'day' : ($days <= 180 ? 'week' : 'month');
    }

    public function dailyGrouped(Carbon $from, Carbon $to, string $by): array
    {
        $rows = $this->daily($from, $to);

        if ($by === 'day') {
            return $rows;
        }

        $fields = ['sales_count', 'gross_sales', 'refunds', 'net_sales', 'cogs', 'gross_profit', 'expenses', 'net_profit'];
        $out = [];

        foreach ($rows as $r) {
            $d = Carbon::parse($r['date']);
            $key = ($by === 'week' ? $d->copy()->startOfWeek() : $d->copy()->startOfMonth())->toDateString();

            $out[$key] ??= ['date' => $key] + array_fill_keys($fields, 0);

            foreach ($fields as $f) {
                $out[$key][$f] += $r[$f];
            }
        }

        return array_values(array_map(
            fn($row) => array_map(fn($v) => is_float($v) ? round($v, 2) : $v, $row),
            $out
        ));
    }

    // sales by hour of day (always 24 rows)
    public function hourly(Carbon $from, Carbon $to): array
    {
        $rows = DB::table('sales')
            ->whereIn('status', self::COUNTED)
            ->whereBetween('sold_at', [$from, $to])
            ->selectRaw('HOUR(sold_at) as h, COUNT(*) as cnt, COALESCE(SUM(total),0) as gross')
            ->groupByRaw('HOUR(sold_at)')
            ->get()
            ->keyBy('h');

        return collect(range(0, 23))->map(fn($h) => [
            'hour'        => $h,
            'sales_count' => (int) ($rows[$h]->cnt ?? 0),
            'gross_sales' => round((float) ($rows[$h]->gross ?? 0), 2),
        ])->all();
    }

    public function salesByCategory(Carbon $from, Carbon $to, int $limit): array
    {
        return DB::table('sale_items as si')
            ->join('sales as s', 's.id', '=', 'si.sale_id')
            ->leftJoin('products as p', 'p.id', '=', 'si.product_id')
            ->leftJoin('categories as c', 'c.id', '=', 'p.category_id')
            ->whereIn('s.status', self::COUNTED)
            ->whereBetween('s.sold_at', [$from, $to])
            ->selectRaw('c.id as category_id, c.name as category,
                SUM(si.qty) as qty,
                SUM(si.line_total - si.tax) as revenue,
                SUM(si.line_total - si.tax - si.qty * si.cost_price) as profit')
            ->groupBy('c.id', 'c.name')
            ->orderByRaw('SUM(si.line_total - si.tax) DESC')
            ->limit($limit)
            ->get()
            ->map(fn($r) => [
                'category_id' => $r->category_id,
                'category'    => $r->category ?? 'No category',
                'qty_sold'    => (float) $r->qty,
                'revenue'     => round((float) $r->revenue, 2),
                'profit'      => round((float) $r->profit, 2),
            ])->values()->all();
    }

    public function topCustomers(Carbon $from, Carbon $to, int $limit): array
    {
        return DB::table('sales as s')
            ->join('customers as c', 'c.id', '=', 's.customer_id')
            ->whereIn('s.status', self::COUNTED)
            ->whereBetween('s.sold_at', [$from, $to])
            ->selectRaw('c.id, c.name, COUNT(*) as cnt, COALESCE(SUM(s.total),0) as gross')
            ->groupBy('c.id', 'c.name')
            ->orderByRaw('SUM(s.total) DESC')
            ->limit($limit)
            ->get()
            ->map(fn($r) => [
                'customer_id' => (int) $r->id,
                'name'        => $r->name,
                'sales_count' => (int) $r->cnt,
                'gross_sales' => round((float) $r->gross, 2),
            ])->values()->all();
    }

    public function expensesByCategory(Carbon $from, Carbon $to): array
    {
        $base = DB::table('expenses as e')
            ->whereNull('e.deleted_at')
            ->whereBetween('e.expense_date', [$from->toDateString(), $to->toDateString()]);

        // foreign key to the category table, whatever it is called
        $fk = collect(['expense_category_id', 'category_id'])
            ->first(fn($c) => Schema::hasColumn('expenses', $c));

        // category table
        $table = collect(['expense_categories', 'categories'])
            ->first(fn($t) => Schema::hasTable($t));

        if ($fk && $table) {
            $q = $base
                ->leftJoin("$table as ec", 'ec.id', '=', "e.$fk")
                ->selectRaw('ec.id as category_id, ec.name as category, COUNT(*) as cnt, COALESCE(SUM(e.amount),0) as total')
                ->groupBy('ec.id', 'ec.name');
        } elseif (Schema::hasColumn('expenses', 'category')) {
            // category stored as plain text on the expense
            $q = $base
                ->selectRaw('NULL as category_id, e.category as category, COUNT(*) as cnt, COALESCE(SUM(e.amount),0) as total')
                ->groupBy('e.category');
        } else {
            // no category info at all: one single row
            $q = $base
                ->selectRaw('NULL as category_id, NULL as category, COUNT(*) as cnt, COALESCE(SUM(e.amount),0) as total');
        }

        return $q->orderByRaw('SUM(e.amount) DESC')
            ->get()
            ->filter(fn($r) => (int) $r->cnt > 0)
            ->map(fn($r) => [
                'category_id' => $r->category_id,
                'category'    => $r->category ?? 'No category',
                'count'       => (int) $r->cnt,
                'total'       => round((float) $r->total, 2),
            ])->values()->all();
    }

    // latest sales, voided ones included (flagged by status)
    public function recentSales(Carbon $from, Carbon $to, int $limit): array
    {
        return DB::table('sales as s')
            ->leftJoin('users as u', 'u.id', '=', 's.user_id')
            ->leftJoin('customers as c', 'c.id', '=', 's.customer_id')
            ->whereBetween('s.sold_at', [$from, $to])
            ->select('s.*', 'u.name as cashier_name', 'c.name as customer_name')
            ->orderByDesc('s.sold_at')
            ->limit($limit)
            ->get()
            ->map(fn($r) => [
                'id'       => (int) $r->id,
                'invoice'  => (string) ($r->invoice_no ?? $r->number ?? $r->id),
                'customer' => $r->customer_name,
                'cashier'  => $r->cashier_name,
                'total'    => round((float) $r->total, 2),
                'status'   => $r->status,
                'sold_at'  => $r->sold_at,
            ])->values()->all();
    }


    // money from returns: cost of goods that went back on the shelf, and the tax that was given back
    private function returnedGoods(Carbon $from, Carbon $to): array
    {
        $row = DB::table('sale_return_items as sri')
            ->join('sale_returns as sr', 'sr.id', '=', 'sri.sale_return_id')
            ->join('sale_items as si', 'si.id', '=', 'sri.sale_item_id')
            ->whereBetween('sr.returned_at', [$from, $to])
            ->selectRaw('COALESCE(SUM(CASE WHEN sri.restock THEN sri.qty * si.cost_price ELSE 0 END),0) as restocked_cost,
                COALESCE(SUM(sri.line_total * si.tax / NULLIF(si.line_total, 0)),0) as refunded_tax')
            ->first();

        return [
            'restocked_cost' => (float) $row->restocked_cost,
            'refunded_tax'   => (float) $row->refunded_tax,
        ];
    }
}
