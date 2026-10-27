<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use App\Http\Resources\RoleResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{


    private const GUARD = 'api';
    private const PROTECTED_ROLES = ['admin'];


    public function index(Request $request): AnonymousResourceCollection
    {
        $roles = Role::query()
            ->where('guard_name', self::GUARD)
            ->with('permissions')
            ->withCount('users')
            ->when($request->filled('search'), fn($q) =>
            $q->where('name', 'like', '%' . $request->string('search') . '%'))
            ->orderBy('name')
            ->paginate(
                min(max($request->integer('per_page', 15), 1), 100)
            );


        return RoleResource::collection($roles);
    }


    public function store(StoreRoleRequest $request): JsonResponse
    {

        $validated = $request->validated();
        $role = DB::transaction(function () use ($validated) {
            $role = Role::create([
                'name' => $validated['name'],
                'guard_name' => self::GUARD,
            ]);



            if (array_key_exists('permissions', $validated)) {
                $role->syncPermissions($validated['permissions'] ?? []);
            }
            return $role;
        });
        $role->load('permissions')->loadCount('users');

        return (new RoleResource($role->load('permissions')->loadCount('users')))
            ->response()
            ->setStatusCode(201);
    }




    public function show(int $id): RoleResource
    {
        $role = Role::where('guard_name', self::GUARD)
            ->with('permissions')
            ->withCount('users')
            ->findOrFail($id);
        return new RoleResource($role);
    }


    public function update(UpdateRoleRequest $request, int $id): JsonResponse|RoleResource
    {
        $role = Role::where('guard_name', self::GUARD)->findOrFail($id);


        $validated = $request->validated();

        if (
            in_array($role->name, self::PROTECTED_ROLES, true)
            && $validated->filled('name')
            && $validated->input('name') !== $role->name
        ) {

            return response()->json(['message' => 'This role cannot be renamed.'], 403);
        }

        DB::transaction(function () use ($validated, $role) {

            if (array_key_exists('name', $validated)) {
                $role->name = $validated['name'];
                $role->save();
            }

            if (array_key_exists('permissions', $validated)) {
                $role->syncPermissions($validated['permissions'] ?? []);
            }
        });
        return new RoleResource($role->fresh()->load('permissions')->loadCount('users'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $role = Role::where('guard_name', self::GUARD)->withCount('users')->findOrFail($id);

        if (in_array($role->name, self::PROTECTED_ROLES, true)) {
            return response()->json(['message' => 'This role cannot be deleted.'], 403);
        }
        if ($role->users_count > 0) {
            return response()->json([
                'message' => "Cannot delete: {$role->users_count} user(s) still use this role.",
            ], 409);
        }
        $role->delete();
        return response()->json(null, 204);
    }
}
