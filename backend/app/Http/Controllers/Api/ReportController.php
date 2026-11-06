<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReportRequest;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function __construct(private ReportService $reports) {}

    private function meta($from, $to, array $extra = []): array
    {
        return ['from' => $from->toDateString(), 'to' => $to->toDateString()] + $extra;
    }

    public function summary(ReportRequest $request): JsonResponse
    {
        [$from, $to] = $this->reports->range($request->input('date_from'), $request->input('date_to'));

        return response()->json(['data' => $this->reports->summary($from, $to)]);
    }

    // one row per day/week/month: ?group_by=auto|day|week|month
    public function daily(ReportRequest $request): JsonResponse
    {
        [$from, $to] = $this->reports->range($request->input('date_from'), $request->input('date_to'));
        $by = $this->reports->resolveGroup($from, $to, (string) $request->input('group_by', 'day'));

        return response()->json([
            'data' => $this->reports->dailyGrouped($from, $to, $by),
            'meta' => $this->meta($from, $to, ['group_by' => $by]),
        ]);
    }

    // best sellers: ?sort=qty|revenue|profit&limit=10
    public function topProducts(ReportRequest $request): JsonResponse
    {
        [$from, $to] = $this->reports->range($request->input('date_from'), $request->input('date_to'));

        return response()->json([
            'data' => $this->reports->topProducts(
                $from,
                $to,
                $request->integer('limit', 10),
                (string) $request->input('sort', 'qty'),
            ),
            'meta' => $this->meta($from, $to),
        ]);
    }

    public function cashiers(ReportRequest $request): JsonResponse
    {
        [$from, $to] = $this->reports->range($request->input('date_from'), $request->input('date_to'));

        return response()->json([
            'data' => $this->reports->cashiers($from, $to),
            'meta' => $this->meta($from, $to),
        ]);
    }

    // products at or below their reorder level; meta.total is the real count
    public function lowStock(ReportRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->reports->lowStock($request->integer('limit', 50)),
            'meta' => ['total' => $this->reports->lowStockCount()],
        ]);
    }

    // what the stock on the shelf is worth
    public function stockValue(): JsonResponse
    {
        return response()->json(['data' => $this->reports->stockValue()]);
    }

    // ------------------------------------------------------------ new endpoints

    public function hourly(ReportRequest $request): JsonResponse
    {
        [$from, $to] = $this->reports->range($request->input('date_from'), $request->input('date_to'));

        return response()->json(['data' => $this->reports->hourly($from, $to), 'meta' => $this->meta($from, $to)]);
    }

    public function categories(ReportRequest $request): JsonResponse
    {
        [$from, $to] = $this->reports->range($request->input('date_from'), $request->input('date_to'));

        return response()->json([
            'data' => $this->reports->salesByCategory($from, $to, $request->integer('limit', 8)),
            'meta' => $this->meta($from, $to),
        ]);
    }

    public function customers(ReportRequest $request): JsonResponse
    {
        [$from, $to] = $this->reports->range($request->input('date_from'), $request->input('date_to'));

        return response()->json([
            'data' => $this->reports->topCustomers($from, $to, $request->integer('limit', 5)),
            'meta' => $this->meta($from, $to),
        ]);
    }

    public function expenses(ReportRequest $request): JsonResponse
    {
        [$from, $to] = $this->reports->range($request->input('date_from'), $request->input('date_to'));

        return response()->json(['data' => $this->reports->expensesByCategory($from, $to), 'meta' => $this->meta($from, $to)]);
    }

    public function recentSales(ReportRequest $request): JsonResponse
    {
        [$from, $to] = $this->reports->range($request->input('date_from'), $request->input('date_to'));

        return response()->json([
            'data' => $this->reports->recentSales($from, $to, $request->integer('limit', 10)),
            'meta' => $this->meta($from, $to),
        ]);
    }
}
