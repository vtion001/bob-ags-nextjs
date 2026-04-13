<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserRole;
use App\Models\UserSettings;
use App\Models\CTMAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function permissions(Request $request)
    {
        $user = $request->user();
        $role = $user->role;

        return response()->json([
            'role'        => $role?->role ?? 'viewer',
            'permissions' => $role?->permissions ?? [],
        ]);
    }

    public function settings(Request $request)
    {
        $user     = $request->user();
        $settings = $user->settings?->settings ?? [];

        return response()->json(['settings' => $settings]);
    }

    public function updateSettings(Request $request)
    {
        $user     = $request->user();
        $settings = $user->settings ?? new UserSettings(['user_id' => $user->id]);

        $current = $settings->settings ?? [];
        $settings->settings = array_merge($current, array_filter($request->only([
            'ctm_agent_id', 'theme', 'notifications_enabled',
        ]), fn($v) => $v !== null));
        $settings->save();

        return response()->json(['success' => true, 'settings' => $settings->settings]);
    }

    public function ctmAssignments(Request $request)
    {
        $assignments = CTMAssignment::where('user_id', $request->user()->id)->get();

        return response()->json(['assignments' => $assignments]);
    }

    public function fixRole(Request $request)
    {
        $request->validate(['email' => 'required|email', 'role' => 'required|string']);

        $user = User::where('email', $request->email)->firstOrFail();
        $user->role()->updateOrCreate(
            ['user_id' => $user->id],
            ['role' => $request->role, 'email' => $user->email]
        );

        return response()->json(['success' => true]);
    }

    public function create(Request $request)
    {
        $request->validate([
            'email'    => 'required|email|unique:users',
            'role'     => 'required|string',
            'password' => 'required|min:8',
        ]);

        $user = User::create([
            'email'    => $request->email,
            'password' => Hash::make($request->password),
        ]);

        UserRole::create([
            'user_id' => $user->id,
            'email'   => $user->email,
            'role'    => $request->role,
        ]);

        return response()->json(['success' => true, 'user' => $user]);
    }
}
