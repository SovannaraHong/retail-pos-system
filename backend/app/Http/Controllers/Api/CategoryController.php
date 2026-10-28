<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CategoryController extends Controller
{

    public function index(Request $request): AnonymousResourceCollection
    {
        $categories = Category::query()
            ->with('parent:id,name')
            ->withCount(['products', 'children'])
            ->when($request->filled('search'), fn($q) =>
            $q->where('name', 'like', '%' . $request->input('search') . '%'))
            ->when($request->filled('parent_id'), fn($q) =>
            $q->where('parent_id', $request->integer('parent_id')))
            ->when($request->filled('is_active'), fn($q) =>
            $q->where('is_active', $request->boolean('is_active')))

            ->when($request->boolean('only_trashed'), fn($q) => $q->onlyTrashed())
            ->orderBy('name')
            ->paginate(min($request->integer('per_page', 15), 100));

        return CategoryResource::collection($categories);
    }


    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $categories = Category::create($request->validated());

        return (new CategoryResource($categories->load('parent:id,name')))->response()->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): CategoryResource
    {
        $category = Category::withTrashed()
            ->with('parent:id,name')
            ->withCount(['products', 'children'])
            ->findOrFail($id);
        return new  CategoryResource($category);
    }


    public function update(UpdateCategoryRequest $request, int $id): CategoryResource
    {
        $category = Category::findOrFail($id);
        $category->update($request->validated());

        return new CategoryResource($category->fresh()
            ->load('parent:id,name')->loadCount(['products', 'children']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id): JsonResponse
    {
        $category = Category::withCount(['products', 'children'])->findOrFail($id);


        if ($category->children_count > 0) {
            return response()->json(['message' => 'Cannot delete: this category has sub-categories.'], 409);
        }

        if ($category->products_count > 0) {
            return response()->json([
                'message' => "Cannot delete: {$category->products_count} product(s) use this category.",
            ], 409);
        }
        $category->delete(); // soft delete

        return response()->json(null, 204);
    }

    public function restore(int $id): CategoryResource
    {
        $category = Category::onlyTrashed()->findOrFail($id);
        $category->restore();

        return new CategoryResource($category->load('parent:id,name'));
    }
}
