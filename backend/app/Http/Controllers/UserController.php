<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->is_admin, 403);

        return User::orderBy('display_name')->get()->map(fn (User $u) => $u->toUserArray());
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->is_admin, 403);

        $data = $request->validate([
            'username' => 'required|string|unique:users,username',
            'displayName' => 'required|string',
            'roleName' => 'required|string',
            'password' => 'required|string|min:4',
            'pages' => 'present|array',
            'active' => 'sometimes|boolean',
        ]);

        $user = User::create([
            'username' => $data['username'],
            'display_name' => $data['displayName'],
            'role_name' => $data['roleName'],
            'pages' => $data['pages'] ?? [],
            'active' => $data['active'] ?? true,
            'password' => Hash::make($data['password']),
        ]);

        return response()->json($user->toUserArray(), 201);
    }

    public function update(Request $request, User $user)
    {
        abort_unless($request->user()->is_admin, 403);

        $data = $request->validate([
            'displayName' => 'sometimes|required|string',
            'roleName' => 'sometimes|required|string',
            'password' => 'sometimes|string|min:4',
            'pages' => 'present|array',
            'active' => 'sometimes|boolean',
        ]);

        $update = [];
        if (isset($data['displayName'])) {
            $update['display_name'] = $data['displayName'];
        }
        if (isset($data['roleName'])) {
            $update['role_name'] = $data['roleName'];
        }
        if (isset($data['pages'])) {
            $update['pages'] = $data['pages'];
        }
        if (isset($data['active'])) {
            $update['active'] = $data['active'];
        }
        if (! empty($data['password'])) {
            $update['password'] = Hash::make($data['password']);
        }

        $user->update($update);

        return response()->json($user->fresh()->toUserArray());
    }

    public function destroy(Request $request, User $user)
    {
        abort_unless($request->user()->is_admin, 403);

        $user->delete();

        return response()->json(null, 204);
    }
}
