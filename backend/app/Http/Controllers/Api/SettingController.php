<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSettingRequest;
use App\Models\Settings;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SettingController extends Controller
{
    private const KEYS = [
        'store_name',
        'store_phone',
        'store_address',
        'store_email',
        'tax_id',
        'receipt_header',
        'receipt_footer'
    ];
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => $this->all()
        ]);
    }

    // everyone who is logged in (cashiers too): what a receipt needs
    public function receipt(): JsonResponse
    {
        return response()->json([
            'data' => $this->all() + ['currency' => config('bakong.currency', 'USD')],
        ]);
    }



    public function update(UpdateSettingRequest $request): JsonResponse
    {
        DB::transaction(function () use ($request) {
            foreach ($request->validated() as $key => $value) {
                Settings::updateOrCreate(
                    ['key' => $key],
                    ['value' => $value]
                );
            }
        });

        return response()->json([
            'data' => $this->all()
        ]);
    }
    private function all(): array
    {
        $store = Settings::query()
            ->whereIn('key', self::KEYS)
            ->pluck('value', 'key');

        return collect(self::KEYS)
            ->mapWithKeys(fn($key) => [
                $key => $store->get($key)
            ])
            ->all();
    }
}
