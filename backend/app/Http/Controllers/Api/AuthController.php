<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use PHPOpenSourceSaver\JWTAuth\JWTGuard;

class AuthController extends Controller
{
    private function guard(): JWTGuard
    {
        /** @var JWTGuard $guard */
        $guard = auth('api');

        return $guard;
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $token = $this->guard()->attempt($request->only('email', 'password'));

        if (! $token) {
            return response()->json(['message' => 'Invalid email or password.'], 422);
        }

        /** @var User $user */
        $user = $this->guard()->user();

        if (! $user->is_active) {
            $this->guard()->logout();

            return response()->json(['message' => 'This account is deactivated.'], 403);
        }

        return $this->respondWithToken($token);
    }

    public function me(): JsonResponse
    {
        /** @var User $user */
        $user = $this->guard()->user();

        return response()->json([
            'user' => new UserResource($user->load('roles')),
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ]);
    }

    public function refresh(): JsonResponse
    {
        return $this->respondWithToken($this->guard()->refresh());
    }

    public function logout(): JsonResponse
    {
        $this->guard()->logout();

        return response()->json(null, 204);
    }

    private function respondWithToken(string $token): JsonResponse
    {
        /** @var User $user */
        $user = $this->guard()->user();

        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => $this->guard()->factory()->getTTL() * 60,
            'user' => new UserResource($user->load('roles')),
            'permission' => $user->getAllPermissions()->pluck('name')
        ]);
    }
}
