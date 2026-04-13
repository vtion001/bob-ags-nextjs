<?php

namespace App\Http\Controllers;

use App\Models\AgentProfile;
use Illuminate\Http\Request;

class AgentsController extends Controller
{
    public function index(Request $request)
    {
        $profiles = AgentProfile::where('user_id', $request->user()->id)->get();
        return response()->json(['profiles' => $profiles]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'agent_id' => 'required|string|max:255',
        ]);

        $profile = AgentProfile::create([
            'user_id'  => $request->user()->id,
            'name'     => $request->name,
            'agent_id' => $request->agent_id,
            'email'    => $request->email,
            'phone'    => $request->phone,
            'notes'    => $request->notes,
        ]);

        return response()->json(['success' => true, 'profile' => $profile], 201);
    }

    public function show(Request $request, string $id)
    {
        $profile = AgentProfile::where('user_id', $request->user()->id)->findOrFail($id);
        return response()->json(['profile' => $profile]);
    }

    public function update(Request $request, string $id)
    {
        $profile = AgentProfile::where('user_id', $request->user()->id)->findOrFail($id);
        $profile->update($request->only(['name', 'agent_id', 'email', 'phone', 'notes']));
        return response()->json(['success' => true, 'profile' => $profile]);
    }

    public function destroy(Request $request, string $id)
    {
        AgentProfile::where('user_id', $request->user()->id)->findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }

    public function import(Request $request)
    {
        $request->validate(['agents' => 'required|array']);

        $created = 0;
        foreach ($request->agents as $agent) {
            AgentProfile::updateOrCreate(
                ['user_id' => $request->user()->id, 'agent_id' => $agent['agent_id']],
                ['name' => $agent['name'], 'email' => $agent['email'] ?? null]
            );
            $created++;
        }

        return response()->json(['success' => true, 'imported' => $created]);
    }
}
