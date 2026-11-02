<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expenses;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ExpenseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to'   => ['nullable', 'date'],
        ]);

        $query = Expenses::query()
            ->with('user:id,name')
            ->when($request->filled('category'), fn($q) =>
            $q->where('category', (string) $request->input('category')))

            ->when($request->filled('user_id'), fn($q) =>
            $q->where('user_id', $request->integer('user_id')))

            ->when($request->filled('search'), fn($q) =>
            $q->where('note', 'like', '%' . $request->input('search') . '%'))

            ->when($request->filled('date_from'), fn($q) =>
            $q->whereDate('expense_date', '>=', $request->input('date_from')))

            ->when($request->filled('date_to'), fn($q) =>
            $q->whereDate('expense_date', '<=', $request->input('date_to')))

            ->when($request->boolean('only_trashed'), fn($q) => $q->onlyTrashed());

        // total of ALL rows that match the filters, not just this page
        $total = round((float) (clone $query)->sum('amount'), 2);

        $expenses = $query
            ->latest('expense_date')
            ->latest('id')
            ->paginate(min($request->integer('per_page', 15), 100));

        return ExpenseResource::collection($expenses)
            ->additional(['summary' => ['total_amount' => $total]]);
    }


    // for a dropdown: the categories already used
    public function categories(): JsonResponse
    {
        $categories = Expenses::query()
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return response()->json(['data' => $categories]);
    }

    public function store(StoreExpenseRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['user_id'] = $request->user('api')->id;
        $data['expense_date'] = $data['expense_date'] ?? now()->toDateString();

        $expense = Expenses::create($data);

        return (new ExpenseResource($expense->load('user:id,name')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(int $id): ExpenseResource
    {
        return new ExpenseResource(Expenses::withTrashed()->with('user:id,name')->findOrFail($id));
    }


    public function update(UpdateExpenseRequest $request, int $id): ExpenseResource
    {
        $expense = Expenses::findOrFail($id);
        $expense->update($request->validated());

        return new ExpenseResource($expense->fresh()->load('user:id,name'));
    }

    public function destroy(int $id): JsonResponse
    {
        Expenses::findOrFail($id)->delete(); // soft delete, the row stays for audit

        return response()->json(null, 204);
    }

    public function restore(int $id): ExpenseResource
    {
        $expense = Expenses::onlyTrashed()->findOrFail($id);
        $expense->restore();

        return new ExpenseResource($expense->load('user:id,name'));
    }
}
