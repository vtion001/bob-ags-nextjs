<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class CTMController extends Controller
{
    private string $baseUrl;
    private string $accessKey;
    private string $secretKey;
    private string $accountId;

    public function __construct()
    {
        $this->baseUrl   = config('services.ctm.api_url', 'https://api.calltrackingmetrics.com/api/v1');
        $this->accessKey = config('services.ctm.access_key', '');
        $this->secretKey = config('services.ctm.secret_key', '');
        $this->accountId = config('services.ctm.account_id', '');
    }

    private function ctm(string $path, array $query = []): mixed
    {
        $response = Http::withBasicAuth($this->accessKey, $this->secretKey)
            ->get("{$this->baseUrl}/accounts/{$this->accountId}/{$path}", $query);

        return $response->json();
    }

    public function calls(Request $request)
    {
        $data = $this->ctm('calls', $request->only(['limit', 'hours', 'status', 'source_id', 'agent_id']));
        return response()->json(['calls' => $data['calls'] ?? [], 'success' => true]);
    }

    public function call(string $id)
    {
        $data = $this->ctm("calls/{$id}");
        return response()->json(['call' => $data]);
    }

    public function callsHistory(Request $request)
    {
        $data = $this->ctm('calls', $request->only(['hours', 'limit', 'page']));
        return response()->json(['calls' => $data['calls'] ?? [], 'total' => $data['total'] ?? 0]);
    }

    public function searchCalls(Request $request)
    {
        $data = $this->ctm('calls', array_filter([
            'search' => $request->phone,
            'hours'  => $request->hours,
        ]));
        return response()->json(['calls' => $data['calls'] ?? []]);
    }

    public function agents()
    {
        $data = $this->ctm('users');
        return response()->json(['agents' => $data['users'] ?? [], 'userGroups' => $data['user_groups'] ?? []]);
    }

    public function agentGroups()
    {
        $data = $this->ctm('user_groups');
        return response()->json(['userGroups' => $data['user_groups'] ?? []]);
    }

    public function dashboardStats()
    {
        $data = $this->ctm('calls', ['hours' => 24, 'limit' => 1]);
        return response()->json(['stats' => $data]);
    }

    public function liveCalls()
    {
        $data = $this->ctm('calls', ['status' => 'active']);
        return response()->json(['calls' => $data['calls'] ?? []]);
    }

    public function activeCalls()
    {
        $data = $this->ctm('calls', ['status' => 'active']);
        return response()->json(['calls' => $data['calls'] ?? []]);
    }

    public function resource(string $resource)
    {
        $map = [
            'numbers'          => 'numbers',
            'schedules'        => 'schedules',
            'sources'          => 'sources',
            'voice_menus'      => 'voice_menus',
            'receiving_numbers'=> 'receiving_numbers',
            'accounts'         => 'accounts',
        ];

        $path = $map[$resource] ?? $resource;
        $data = $this->ctm($path);

        return response()->json([$resource => $data[$resource] ?? $data]);
    }
}
