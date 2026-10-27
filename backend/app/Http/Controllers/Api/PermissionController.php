<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePermissionRequest;
use App\Http\Requests\UpdatePermissionRequest;
use App\Http\Resources\PermissionResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    private const GUARD = 'api';

    public function index(Request $request): AnonymousResourceCollection
    {
        $permissions = Permission::query()
            ->where('guard_name', self::GUARD)
            ->when($request->filled('search'), fn($q) =>
            $q->where('name', 'like', '%' . $request->string('search') . '%'))
            ->orderBy('name')
            ->paginate($request->integer('per_page', 50));
        return PermissionResource::collection($permissions);
    }


    public function store(StorePermissionRequest $request): JsonResponse
    {
        $permission = Permission::create([
            ...$request->validated(),
            'guard_name' => self::GUARD,
        ]);

        return (new PermissionResource($permission))
            ->response()
            ->setStatusCode(201);
    }


    public function show(int $id): PermissionResource
    {
        return new PermissionResource(Permission::where('guard_name', self::GUARD)->findOrFail($id));
    }


    public function update(UpdatePermissionRequest $request, int $id): PermissionResource
    {
        $permission = Permission::where('guard_name', self::GUARD)->findOrFail($id);
        $permission->update($request->validated());

        return new PermissionResource($permission->fresh());
    }

    public function destroy(int $id)
    {
        $permission = Permission::where('guard_name', self::GUARD)->findOrFail($id);
        $permission->delete();
        return response()->json(null, 204);
    }
}
