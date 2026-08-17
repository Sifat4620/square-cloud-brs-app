<?php

namespace App\Http\Controllers;

use App\Models\BackupTest;
use Illuminate\Http\Request;

class BackupController extends Controller
{
    private function rules(): array
    {
        return [
            'year' => 'required|integer',
            'month' => 'required|integer|between:1,12',
            'state' => 'required|in:Pending,Completed,Failed,Approved',
            'responsibleName' => 'nullable|string',
            'responsibleDesignation' => 'nullable|string',
            'date' => 'nullable|date',
            'signature' => 'nullable|string',
            'entries' => 'present|array',
            'entries.*.clientId' => 'required',
            'entries.*.clientName' => 'required|string',
            'entries.*.logsStatus' => 'nullable|string',
            'entries.*.testStatus' => 'required|in:OK,FAILED,PENDING,N/A',
            'entries.*.remarks' => 'nullable|string',
        ];
    }

    private function entryRows(array $entries): array
    {
        return array_map(function ($e) {
            return [
                'client_id' => $e['clientId'],
                'client_name' => $e['clientName'],
                'logs_status' => $e['logsStatus'] ?? null,
                'test_status' => $e['testStatus'],
                'remarks' => $e['remarks'] ?? null,
            ];
        }, $entries);
    }

    public function index(Request $request)
    {
        abort_unless($request->user()->canAccessPage('backup-list'), 403);

        $q = BackupTest::query()->with('entries');
        if ($request->filled('year')) {
            $q->where('year', $request->year);
        }
        if ($request->filled('state')) {
            $q->where('state', $request->state);
        }

        return $q->orderByDesc('year')->orderByDesc('month')->get()->map(fn (BackupTest $b) => $b->toApiModel());
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->canAccessPage('backup-form'), 403);

        $data = $request->validate($this->rules());

        $bt = BackupTest::create([
            'year' => $data['year'],
            'month' => $data['month'],
            'state' => $data['state'],
            'responsible_name' => $data['responsibleName'] ?? null,
            'responsible_designation' => $data['responsibleDesignation'] ?? null,
            'date' => $data['date'] ?? null,
            'signature' => $data['signature'] ?? null,
        ]);
        $bt->entries()->createMany($this->entryRows($data['entries']));

        return response()->json($bt->load('entries')->toApiModel(), 201);
    }

    public function show(Request $request, BackupTest $backup)
    {
        abort_unless($request->user()->canAccessPage('backup-list'), 403);

        return response()->json($backup->load('entries')->toApiModel());
    }

    public function update(Request $request, BackupTest $backup)
    {
        abort_unless($request->user()->canAccessPage('backup-form'), 403);

        $data = $request->validate($this->rules());

        $backup->update([
            'year' => $data['year'],
            'month' => $data['month'],
            'state' => $data['state'],
            'responsible_name' => $data['responsibleName'] ?? null,
            'responsible_designation' => $data['responsibleDesignation'] ?? null,
            'date' => $data['date'] ?? null,
            'signature' => $data['signature'] ?? null,
        ]);
        $backup->entries()->delete();
        $backup->entries()->createMany($this->entryRows($data['entries']));

        return response()->json($backup->load('entries')->toApiModel());
    }

    public function destroy(Request $request, BackupTest $backup)
    {
        abort_unless($request->user()->canAccessPage('backup-form'), 403);

        $backup->delete();

        return response()->json(null, 204);
    }
}
