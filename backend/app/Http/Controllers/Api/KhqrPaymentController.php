<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreKhqrPaymentRequest;
use App\Http\Resources\KhqrPaymentResource;
use App\Models\KhqrPayment;
use App\Services\Bakong\BakongException;
use App\Services\Bakong\KhqrPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;

class KhqrPaymentController extends Controller
{
    private const WITH_SALE = ['user:id,name', 'sale.user:id,name', 'sale.customer:id,name', 'sale.items', 'sale.payments'];

    // managers: see every QR payment, especially the "needs_review" ones
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to'   => ['nullable', 'date'],
        ]);

        $payments = KhqrPayment::query()
            ->with('user:id,name')
            ->when($request->filled('status'), fn($q) =>
            $q->where('status', (string) $request->input('status')))
            ->when($request->filled('user_id'), fn($q) =>
            $q->where('user_id', $request->integer('user_id')))
            ->when($request->filled('date_from'), fn($q) =>
            $q->whereDate('created_at', '>=', $request->input('date_from')))
            ->when($request->filled('date_to'), fn($q) =>
            $q->whereDate('created_at', '<=', $request->input('date_to')))
            ->latest('id')
            ->paginate(min($request->integer('per_page', 15), 100));

        return KhqrPaymentResource::collection($payments);
    }

    // create the QR for a cart
    public function store(StoreKhqrPaymentRequest $request, KhqrPaymentService $service): JsonResponse
    {
        $payment = $service->create($request->user('api'), $request->validated());

        return (new KhqrPaymentResource($payment->load('user:id,name')))
            ->response()
            ->setStatusCode(201);
    }

    // the app polls this every ~3 seconds until status is no longer "pending"
    public function show(Request $request, int $id, KhqrPaymentService $service): KhqrPaymentResource
    {
        $payment = $this->findVisible($request, $id);
        $warning = null;

        try {
            $payment = $service->refresh($payment);
        } catch (BakongException $e) {
            // Bakong is down or unreachable: the payment stays pending and the app keeps polling
            Log::warning('KHQR check failed', ['payment' => $payment->id, 'error' => $e->getMessage()]);
            $warning = $e->getMessage();
        }

        $resource = new KhqrPaymentResource($payment->load(self::WITH_SALE));

        return $warning ? $resource->additional(['warning' => $warning]) : $resource;
    }

    public function cancel(Request $request, int $id, KhqrPaymentService $service): KhqrPaymentResource
    {
        $payment = $this->findVisible($request, $id);

        if ($payment->status !== 'pending') {
            abort(409, 'Only a pending payment can be cancelled (this one is ' . $payment->status . ').');
        }

        $payment = $service->cancel($payment);

        if ($payment->status === 'paid') {
            abort(409, 'The customer has just paid, so this QR cannot be cancelled. The sale was created.');
        }

        return new KhqrPaymentResource($payment->load('user:id,name'));
    }

    // cashiers see only their own QR payments; anyone with reports.view sees all
    private function findVisible(Request $request, int $id): KhqrPayment
    {
        $payment = KhqrPayment::findOrFail($id);

        if (! $request->user('api')->can('reports.view') && $payment->user_id !== $request->user('api')->id) {
            abort(404);
        }

        return $payment;
    }
}
