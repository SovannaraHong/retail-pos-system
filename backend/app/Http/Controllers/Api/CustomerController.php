<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Models\Customers;
use App\Models\SaleReturns;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CustomerController extends Controller
{

    // sales that count for a customer: everything except voided and held
    private const COUNTED = ['completed', 'partially_refunded', 'refunded'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $customers = Customers::query()
            ->withCount(['sales as sales_count' => fn($q) => $q->whereIn('status', self::COUNTED)])

            ->withSum(['sales as total_sales' => fn($q) => $q->whereIn('status', self::COUNTED)], 'total')

            ->when($request->filled('search'), function ($q) use ($request) {
                $s = (string) $request->input('search');
                $q->where(fn($q) => $q
                    ->where('name', 'like', "%{$s}%")
                    ->orWhere('phone', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%"));
            })
            ->when($request->filled('is_active'), fn($q) =>
            $q->where('is_active', $request->boolean('is_active')))
            ->when($request->boolean('only_trashed'), fn($q) => $q->onlyTrashed())
            ->orderBy('name')
            ->paginate(min($request->integer('per_page', 15), 100));

        return CustomerResource::collection($customers);
    }

    // checkout screen: type or scan a phone number and get the customer
    public function findByPhone(string $phone): CustomerResource
    {
        $phone = preg_replace('/[\s\-\.\(\)]/', '', $phone);

        $customer = Customers::query()
            ->where('is_active', true)
            ->where('phone', $phone)
            ->firstOrFail();

        return new CustomerResource($customer);
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $customer = Customers::create($request->validated());

        return (new CustomerResource($customer))
            ->response()
            ->setStatusCode(201);
    }

    public function show(int $id): CustomerResource
    {
        $customer = Customers::withTrashed()
            ->withCount(['sales as sales_count' => fn($q) => $q->whereIn('status', self::COUNTED)])
            ->withSum(['sales as total_sales' => fn($q) => $q->whereIn('status', self::COUNTED)], 'total')
            ->findOrFail($id);

        // money given back through returns, to show what the customer really spent
        $refunded = (float) SaleReturns::query()
            ->whereIn('sale_id', $customer->sales()->whereIn('status', self::COUNTED)->select('id'))
            ->sum('total_refund');

        $customer->setAttribute('total_refunded', $refunded);
        $customer->setAttribute('net_spent', (float) $customer->total_sales - $refunded);

        return new CustomerResource($customer);
    }

    public function update(UpdateCustomerRequest $request, int $id): CustomerResource
    {
        $customer = Customers::findOrFail($id);
        $customer->update($request->validated());

        return new CustomerResource($customer->fresh());
    }

    public function destroy(int $id): JsonResponse
    {
        $customer = Customers::findOrFail($id);

        $salesCount = $customer->sales()->count();

        if ($salesCount > 0) {
            return response()->json([
                'message' => "Cannot delete: this customer has {$salesCount} sale(s). Set is_active to false instead.",
            ], 409);
        }

        $customer->delete(); // soft delete

        return response()->json(null, 204);
    }

    public function restore(int $id): CustomerResource
    {
        $customer = Customers::onlyTrashed()->findOrFail($id);
        $customer->restore();

        return new CustomerResource($customer);
    }
}
