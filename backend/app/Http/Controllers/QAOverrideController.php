<?php

namespace App\Http\Controllers;

use App\Models\QAOverride;
use Illuminate\Http\Request;

class QAOverrideController extends Controller
{
    public function index(Request $request)
    {
        $overrides = QAOverride::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json(['overrides' => $overrides]);
    }

    public function store(Request $request)
    {
        $request->validate(['call_id' => 'required|string', 'score' => 'required|integer']);

        $override = QAOverride::create([
            'call_id'      => $request->call_id,
            'ctm_call_id'  => $request->ctm_call_id,
            'user_id'      => $request->user()->id,
            'overrides'    => $request->overrides ?? [],
            'manual_score' => $request->score,
            'notes'        => $request->notes,
        ]);

        return response()->json(['success' => true, 'override' => $override], 201);
    }

    public function show(string $id)
    {
        return response()->json(['override' => QAOverride::findOrFail($id)]);
    }

    public function update(Request $request, string $id)
    {
        $override = QAOverride::where('user_id', $request->user()->id)->findOrFail($id);
        $override->update($request->only(['overrides', 'manual_score', 'notes']));
        return response()->json(['success' => true, 'override' => $override]);
    }

    public function destroy(Request $request, string $id)
    {
        QAOverride::where('user_id', $request->user()->id)->findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}
