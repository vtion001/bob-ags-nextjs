<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        $role = $user->role?->role ?? 'viewer';
        $permissions = $user->role?->permissions ?? $this->defaultPermissions();

        return response()->json([
            'success'     => true,
            'user'        => ['id' => $user->id, 'email' => $user->email],
            'role'        => $role,
            'permissions' => $permissions,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['success' => true, 'message' => 'Logged out']);
    }

    public function user(Request $request)
    {
        $user = $request->user();
        $role = $user->role?->role ?? 'viewer';
        $permissions = $user->role?->permissions ?? $this->defaultPermissions();

        return response()->json([
            'success'     => true,
            'user'        => ['id' => $user->id, 'email' => $user->email],
            'role'        => $role,
            'permissions' => $permissions,
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name'                  => 'required|string|max:255',
            'email'                 => 'required|email|unique:users',
            'password'              => 'required|min:8|confirmed',
        ]);

        $user = User::create([
            'full_name' => $request->name,
            'email'     => $request->email,
            'password'  => Hash::make($request->password),
        ]);

        UserRole::create(['user_id' => $user->id, 'email' => $user->email]);

        return response()->json(['success' => true, 'message' => 'Registered successfully']);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        return response()->json(['success' => true, 'message' => 'Password reset email sent if account exists']);
    }

    private function defaultPermissions(): array
    {
        return [
            'can_view_calls'      => true,
            'can_view_monitor'    => true,
            'can_view_history'    => false,
            'can_view_agents'     => false,
            'can_manage_settings' => false,
            'can_manage_users'    => false,
            'can_run_analysis'    => false,
        ];
    }
}
