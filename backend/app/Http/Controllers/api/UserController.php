<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        //

        $user = User::query()
            ->with(['branch', 'roles'])
            ->when($request->filled('branch_id'), fn($q) => $q->where('branch_id', $request->integer('branch_id')))
            ->when($request->filled('is_active'), fn($q) => $q->where('is_active', true))
            ->when($request->filled('search'), fn($q) => $q->where('name', 'like', '%' . $request->string('search') . '%'))
            ->paginate($request->integer('per_page', 10));
        return UserResource::collection($user)->response();
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request)
    {
        //

        // $user =User::create()
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
