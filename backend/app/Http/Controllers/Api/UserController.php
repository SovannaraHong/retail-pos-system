<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    private const DISK = 's3';
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $users = User::query()
            ->with('roles')
            ->when($request->filled('search'), function ($q) use ($request) {
                $s = $request->string('search')->toString();
                $q->where(fn($q) => $q
                    ->where('name', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%")
                    ->orWhere('employee_code', 'like', "%{$s}%")
                    ->orWhere('phone', 'like', "%{$s}%"));
            })
            // ->when($request->filled('role_id'), fn($q) =>
            // $q->whereHas('roles', fn($r) => $r->where('roles.id', $request->integer('role_id'))))

            ->when(
                $request->filled('role_id'),
                fn($q) =>
                $q->whereHas(
                    'roles',
                    fn($r) =>
                    $r->whereKey($request->integer('role_id'))
                )
            ) //short version

            ->when($request->filled('is_active'), fn($q) =>
            $q->where('is_active', $request->boolean('is_active')))

            ->when($request->boolean('only_trashed'), fn($q) => $q->onlyTrashed())
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return UserResource::collection($users);
    }


    public function store(StoreUserRequest $request): JsonResponse
    {

        $data = $request->safe()->except(['image', 'role_id']);
        $path = null;

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('users', self::DISK);
            $data['image'] = $path;
        }

        try {
            $user = DB::transaction(function () use ($data, $request) {
                $user = User::create($data);

                if ($request->filled('role_id')) {
                    $user->syncRoles($request->integer('role_id'));
                }
                return $user;
            });
        } catch (\Throwable $e) {
            if ($path) {
                Storage::disk(self::DISK)->delete($path);
            }
            throw $e;
        }

        return (new UserResource($user->load('roles')))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): UserResource
    {

        return new UserResource(User::withTrashed()->with('roles')->findOrFail($id));
    }


    public function update(UpdateUserRequest $request, int $id): UserResource
    {

        $user = User::findOrFail($id);

        $data = $request->safe()->except(['image', 'role_id', 'remove_image', 'password', 'pin']);


        if ($request->filled('password')) {
            $data['password'] = $request->input('password');
        }
        if ($request->filled('pin')) {
            $data['pin'] = $request->input('pin');
        }


        $oldImage = $user->image;
        $newPath = null;

        if ($request->hasFile('image')) {

            $newPath = $request->file('image')->store('users', self::DISK);
            $data['image'] = $newPath;
        } elseif ($request->boolean('remove_image')) {
            $data['image'] = null;
        }
        try {
            DB::transaction(function () use ($user, $request, $data) {
                $user->update($data);

                if ($request->filled('role_id')) {
                    $user->syncRoles($request->integer('role_id'));
                }
            });
        } catch (\Throwable $e) {
            if ($newPath) {
                Storage::disk(self::DISK)->delete($newPath);
            }
            throw $e;
        }


        // delete old image only after the DB update succeeded
        if ($oldImage && array_key_exists('image', $data) && $data['image'] !== $oldImage) {
            Storage::disk(self::DISK)->delete($oldImage);
        }
        return new UserResource($user->fresh('roles'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {

        $user = User::findOrFail($id);

        if ($user->id === $request->user('api')->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 403);
        }

        $user->delete();

        return response()->json(null, 204);
    }

    public function restore(int $id): UserResource
    {
        $user = User::onlyTrashed()->findOrFail($id);
        $user->restore();
        return new UserResource($user->load('roles'));
    }


    public function forceDelete(Request $request, int $id): JsonResponse
    {
        $user = User::withTrashed()->findOrFail($id);
        if ($user->id === $request->user('api')->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 403);
        }
        if ($user->image) {
            Storage::disk(self::DISK)->delete($user->image);
        }
        $user->forceDelete();
        return response()->json(null, 204);
    }
}
