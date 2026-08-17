<?php

namespace App\Http\Controllers;

use App\Models\Dsr;
use Illuminate\Http\Request;

class DsrController extends Controller
{
    private function rules(): array
    {
        return [
            'date' => 'required|date',
            'name' => 'nullable|string',
            'signature' => 'nullable|string',
            'state' => 'required|in:Draft,Submitted,Approved',
            'uplinks' => 'required|array',
            'p2p' => 'required|array',
            'firewall' => 'required|array',
            'kb' => 'required|array',
            'chq' => 'required|array',
            'ups' => 'required|array',
            'cooling' => 'required|array',
            'generalRemarks' => 'nullable|string',
        ];
    }

    private function payload(array $d): array
    {
        $d['general_remarks'] = $d['generalRemarks'] ?? null;
        unset($d['generalRemarks']);

        return $d;
    }

    public function index(Request $request)
    {
        abort_unless($request->user()->canAccessPage('dsr-list'), 403);

        $q = Dsr::query();
        if ($request->filled('year')) {
            $q->whereYear('date', $request->year);
        }
        if ($request->filled('month')) {
            $q->whereMonth('date', $request->month);
        }
        if ($request->filled('state')) {
            $q->where('state', $request->state);
        }

        return $q->orderByDesc('date')->get()->map(fn (Dsr $d) => $d->toApiModel());
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->canAccessPage('dsr-form'), 403);

        $data = $this->payload($request->validate($this->rules()));
        $dsr = Dsr::create($data);

        return response()->json($dsr->toApiModel(), 201);
    }

    public function show(Request $request, Dsr $dsr)
    {
        abort_unless($request->user()->canAccessPage('dsr-list'), 403);

        return response()->json($dsr->toApiModel());
    }

    public function update(Request $request, Dsr $dsr)
    {
        abort_unless($request->user()->canAccessPage('dsr-form'), 403);

        $data = $this->payload($request->validate($this->rules()));
        $dsr->update($data);

        return response()->json($dsr->fresh()->toApiModel());
    }

    public function destroy(Request $request, Dsr $dsr)
    {
        abort_unless($request->user()->canAccessPage('dsr-form'), 403);

        $dsr->delete();

        return response()->json(null, 204);
    }
}
