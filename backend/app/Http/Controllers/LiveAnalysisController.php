<?php

namespace App\Http\Controllers;

use App\Models\LiveAnalysisLog;
use Illuminate\Http\Request;

class LiveAnalysisController extends Controller
{
    public function index(Request $request)
    {
        $logs = LiveAnalysisLog::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json(['logs' => $logs]);
    }

    public function store(Request $request)
    {
        $request->validate(['call_id' => 'required|string', 'analysis' => 'required']);

        $log = LiveAnalysisLog::create([
            'user_id'  => $request->user()->id,
            'call_id'  => $request->call_id,
            'insights' => $request->analysis,
        ]);

        return response()->json(['success' => true, 'log' => $log], 201);
    }

    public function show(string $id)
    {
        return response()->json(['log' => LiveAnalysisLog::findOrFail($id)]);
    }

    public function update(Request $request, string $id)
    {
        $log = LiveAnalysisLog::where('user_id', $request->user()->id)->findOrFail($id);
        $log->update($request->only(['insights', 'suggested_disposition', 'transcript_preview']));
        return response()->json(['success' => true, 'log' => $log]);
    }

    public function destroy(Request $request, string $id)
    {
        LiveAnalysisLog::where('user_id', $request->user()->id)->findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}
