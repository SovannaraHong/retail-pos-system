<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReportRequest;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function __construct(private ReportService $reports) {}


    public function summary(ReportRequest $request): JsonResponse
    {
        [$from, $to] = $this->reports->range($request->input('date_from'), $request->input('date_to'));

        return response()->json(['data' => $this->reports->summary($from, $to)]);
    }

    // one row per day, for a chart
    public function daily(ReportRequest $request): JsonResponse
    {
        [$from, $to] = $this->reports->range($request->input('date_from'), $request->input('date_to'));

        return response()->json([
            'data' => $this->reports->daily($from, $to),
            'meta' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
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
            'meta' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
        ]);
    }

    public function cashiers(ReportRequest $request): JsonResponse
    {
        [$from, $to] = $this->reports->range($request->input('date_from'), $request->input('date_to'));

        return response()->json([
            'data' => $this->reports->cashiers($from, $to),
            'meta' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
        ]);
    }

    // products at or below their reorder level
    public function lowStock(ReportRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->reports->lowStock($request->integer('limit', 50))]);
    }

    // what the stock on the shelf is worth
    public function stockValue(): JsonResponse
    {
        return response()->json(['data' => $this->reports->stockValue()]);
    }
}
