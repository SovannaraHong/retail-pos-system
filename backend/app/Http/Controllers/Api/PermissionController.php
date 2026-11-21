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
    public const GUARD = 'api';

    private const DEFAULT_PER_PAGE = 60;
    private const MAX_PER_PAGE = 100;


    private const PROTECTED_PREFIX = 'permissions.';

    public function index(Request $request): AnonymousResourceCollection
    {
        $search = trim((string) $request->query('search', ''));
        $perPage = min(
            max($request->integer('per_page', self::DEFAULT_PER_PAGE), 1),
            self::MAX_PER_PAGE,
        );

        $permissions = Permission::query()
            ->where('guard_name', self::GUARD)
            ->when($search !== '', fn($q) => $q->where(
                'name',
                'like',
                '%' . addcslashes($search, '%_\\') . '%',
            ))
            ->orderBy('name')
            ->paginate($perPage);

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
        return new PermissionResource($this->findOrFail($id));
    }

    public function update(UpdatePermissionRequest $request, int $id): PermissionResource|JsonResponse
    {
        $permission = $this->findOrFail($id);
        $newName = $request->validated('name');

        // renaming breaks every ->can('old.name') check in the code base
        if ($newName !== $permission->name) {
            if ($blocked = $this->blockedReason($permission, 'renamed')) {
                return $blocked;
            }
        }

        $permission->update($request->validated());

        return new PermissionResource($permission->fresh());
    }

    public function destroy(int $id): JsonResponse
    {
        $permission = $this->findOrFail($id);

        if ($blocked = $this->blockedReason($permission, 'deleted')) {
            return $blocked;
        }

        $permission->delete();

        return response()->json(null, 204);
    }

    private function findOrFail(int $id): Permission
    {
        return Permission::where('guard_name', self::GUARD)->findOrFail($id);
    }


    private function blockedReason(Permission $permission, string $action): ?JsonResponse
    {
        if (str_starts_with($permission->name, self::PROTECTED_PREFIX)) {
            return response()->json([
                'message' => "This permission manages access control and cannot be {$action}.",
            ], 403);
        }

        $roles = $permission->roles()->count();
        $users = $permission->users()->count();

        if ($roles > 0 || $users > 0) {
            return response()->json([
                'message' => "This permission is in use ({$roles} roles, {$users} users) and cannot be {$action}. Remove it from them first.",
            ], 409);
        }

        return null;
    }
}
