<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('username', $data['username'])->where('active', true)->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Invalid username or password.'], 401);
        }

        $token = $user->createToken('dsr-app')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user->toAuthSession(),
        ]);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->toAuthSession());
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }
}
