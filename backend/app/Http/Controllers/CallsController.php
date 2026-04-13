<?php

namespace App\Http\Controllers;

use App\Models\Call;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class CallsController extends Controller
{
    public function index(Request $request)
    {
        $query = Call::query();

        if ($request->hours) {
            $query->where('timestamp', '>=', now()->subHours($request->hours));
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->ctm_call_id) {
            $query->where('ctm_call_id', $request->ctm_call_id);
        }

        $calls = $query->orderBy('timestamp', 'desc')
            ->limit($request->limit ?? 100)
            ->get();

        return response()->json(['calls' => $calls, 'success' => true]);
    }

    public function search(Request $request)
    {
        $request->validate(['phone' => 'required|string']);

        $calls = Call::where('phone', 'like', "%{$request->phone}%")
            ->orWhere('caller_number', 'like', "%{$request->phone}%")
            ->orderBy('timestamp', 'desc')
            ->limit(50)
            ->get();

        return response()->json(['calls' => $calls, 'success' => true]);
    }

    public function bulkAnalyze(Request $request)
    {
        $limit  = $request->limit ?? 10;
        $offset = $request->offset ?? 0;

        $calls = Call::whereNull('score')
            ->whereNotNull('transcript')
            ->orderBy('timestamp', 'desc')
            ->skip($offset)
            ->take($limit)
            ->get();

        $successCount = 0;
        $failCount    = 0;

        foreach ($calls as $call) {
            try {
                $response = Http::withToken(config('services.openrouter.api_key'))
                    ->post(config('services.openrouter.api_url') . '/chat/completions', [
                        'model'    => 'anthropic/claude-3-haiku',
                        'messages' => [
                            ['role' => 'user', 'content' => "Analyze this call transcript:\n\n{$call->transcript}"],
                        ],
                    ]);

                if ($response->successful()) {
                    $call->update(['score' => 75]);
                    $successCount++;
                } else {
                    $failCount++;
                }
            } catch (\Exception $e) {
                $failCount++;
            }
        }

        return response()->json([
            'success'      => true,
            'processed'    => $calls->count(),
            'successCount' => $successCount,
            'failCount'    => $failCount,
        ]);
    }

    public function analyze(Request $request)
    {
        $request->validate(['transcript' => 'required|string']);

        $response = Http::withToken(config('services.openrouter.api_key'))
            ->post(config('services.openrouter.api_url') . '/chat/completions', [
                'model'    => 'anthropic/claude-3-haiku',
                'messages' => [
                    ['role' => 'user', 'content' => "Analyze this call transcript for QA:\n\n{$request->transcript}"],
                ],
            ]);

        return response()->json(['success' => true, 'analysis' => $response->json()]);
    }

    public function assemblyToken()
    {
        $response = Http::withToken(config('services.assemblyai.api_key'))
            ->post(config('services.assemblyai.api_url') . '/v2/realtime/token', [
                'expires_in' => 480,
            ]);

        return response()->json(['success' => true, 'token' => $response->json('token')]);
    }

    public function transcribe(Request $request)
    {
        $request->validate(['audioUrl' => 'required|string', 'callId' => 'required|string']);

        $response = Http::withToken(config('services.assemblyai.api_key'))
            ->post(config('services.assemblyai.api_url') . '/v2/transcript', [
                'audio_url' => $request->audioUrl,
            ]);

        return response()->json([
            'success'    => true,
            'transcript' => $response->json('text') ?? '',
            'id'         => $response->json('id') ?? '',
        ]);
    }
}
