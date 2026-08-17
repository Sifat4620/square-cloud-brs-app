<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->is_admin, 403);

        return Client::orderBy('name')->get()->map(fn (Client $c) => $c->toApiModel());
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->is_admin, 403);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'active' => 'sometimes|boolean',
        ]);

        $client = Client::create($data);

        return response()->json($client->toApiModel(), 201);
    }

    public function update(Request $request, Client $client)
    {
        abort_unless($request->user()->is_admin, 403);

        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'active' => 'sometimes|boolean',
        ]);

        $client->update($data);

        return response()->json($client->fresh()->toApiModel());
    }
}
