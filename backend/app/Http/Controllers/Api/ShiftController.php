<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CloseShiftRequest;
use App\Http\Requests\OpenShiftRequest;
use App\Http\Resources\ShiftResource;
use App\Models\Shifts;
use App\Models\User;
use App\Services\ShiftService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ShiftController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        //
        $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to'   => ['nullable', 'date'],
        ]);

        $shifts = Shifts::query()
            ->with('user:id,name')
            ->when($request->filled('user_id'), fn($q) =>
            $q->where('user_id', $request->integer('user_id')))

            ->when($request->filled('status'), fn($q) =>
            $q->where('status', (string) $request->input('status')))

            ->when($request->filled('date_from'), fn($q) =>
            $q->whereDate('opened_at', '>=', $request->input('date_from')))

            ->when($request->filled('date_to'), fn($q) =>
            $q->whereDate('opened_at', '<=', $request->input('date_to')))

            ->latest('opened_at')
            ->paginate(min($request->integer('per_page', 15), 100));

        return ShiftResource::collection($shifts);
    }




    public function show(int $id, ShiftService $service): ShiftResource
    {
        $shift = Shifts::with('user:id,name')->findOrFail($id);
        $shift->setAttribute('summary', $service->summary($shift));

        return new ShiftResource($shift);
    }

    // the logged-in cashier's open shift, with live totals
    public function current(Request $request, ShiftService $service): ShiftResource
    {
        $shift = Shifts::with('user:id,name')
            ->where('user_id', $request->user('api')->id)
            ->where('status', 'open')
            ->first();

        if (! $shift) {
            abort(404, 'You have no open shift.');
        }

        $shift->setAttribute('summary', $service->summary($shift));

        return new ShiftResource($shift);
    }


    public function open(OpenShiftRequest $request): JsonResponse
    {
        $userId = $request->user('api')->id;

        $shift = DB::transaction(function () use ($request, $userId) {
            // lock the user row so a double click cannot open two shifts
            User::whereKey($userId)->lockForUpdate()->first();

            if (Shifts::where('user_id', $userId)->where('status', 'open')->exists()) {
                abort(409, 'You already have an open shift. Close it first.');
            }

            return Shifts::create([
                'user_id'      => $userId,
                'opening_cash' => $request->validated('opening_cash'),
                'note'         => $request->validated('note'),
                'status'       => 'open',
                'opened_at'    => now(),
            ]);
        });

        return (new ShiftResource($shift->load('user:id,name')))
            ->response()
            ->setStatusCode(201);
    }

    public function close(CloseShiftRequest $request, ShiftService $service): ShiftResource
    {
        $userId = $request->user('api')->id;

        $shift = DB::transaction(function () use ($request, $userId, $service) {
            $shift = Shifts::where('user_id', $userId)
                ->where('status', 'open')
                ->lockForUpdate()
                ->first();

            if (! $shift) {
                abort(404, 'You have no open shift.');
            }

            $shift->closed_at = now();

            $summary  = $service->summary($shift);
            $closing  = round((float) $request->validated('closing_cash'), 2);
            $expected = $summary['expected_cash'];

            $note = $request->validated('note');

            $shift->update([
                'closing_cash'  => $closing,
                'expected_cash' => $expected,
                'difference'    => round($closing - $expected, 2),
                'status'        => 'closed',
                'closed_at'     => $shift->closed_at,
                'note'          => $note
                    ? trim(($shift->note ? $shift->note . "\n" : '') . 'Close: ' . $note)
                    : $shift->note,
            ]);

            $shift->setAttribute('summary', $summary);

            return $shift;
        });

        return new ShiftResource($shift->load('user:id,name'));
    }
}
