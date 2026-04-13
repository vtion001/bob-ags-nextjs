<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CTMController;
use App\Http\Controllers\CallsController;
use App\Http\Controllers\AgentsController;
use App\Http\Controllers\KnowledgeBaseController;
use App\Http\Controllers\QAOverrideController;
use App\Http\Controllers\LiveAnalysisController;

// Public auth routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // User
    Route::get('/users/permissions', [UserController::class, 'permissions']);
    Route::get('/users/settings', [UserController::class, 'settings']);
    Route::put('/users/settings', [UserController::class, 'updateSettings']);
    Route::get('/users/ctm-assignments', [UserController::class, 'ctmAssignments']);
    Route::post('/admin/fix-user-role', [UserController::class, 'fixRole']);
    Route::post('/admin/users/create', [UserController::class, 'create']);

    // CTM proxy
    Route::get('/ctm/calls/history', [CTMController::class, 'callsHistory']);
    Route::get('/ctm/calls/search', [CTMController::class, 'searchCalls']);
    Route::get('/ctm/calls/{id}', [CTMController::class, 'call']);
    Route::get('/ctm/calls', [CTMController::class, 'calls']);
    Route::get('/ctm/agents/groups', [CTMController::class, 'agentGroups']);
    Route::get('/ctm/agents', [CTMController::class, 'agents']);
    Route::get('/ctm/dashboard/stats', [CTMController::class, 'dashboardStats']);
    Route::get('/ctm/live-calls', [CTMController::class, 'liveCalls']);
    Route::get('/ctm/active-calls', [CTMController::class, 'activeCalls']);
    Route::get('/ctm/monitor/active-calls', [CTMController::class, 'activeCalls']);
    Route::get('/ctm/{resource}', [CTMController::class, 'resource']);

    // Local calls DB
    Route::get('/calls/search', [CallsController::class, 'search']);
    Route::post('/calls/bulk-analyze', [CallsController::class, 'bulkAnalyze']);
    Route::get('/calls', [CallsController::class, 'index']);

    // AI / transcription
    Route::post('/openrouter', [CallsController::class, 'analyze']);
    Route::get('/assemblyai/token', [CallsController::class, 'assemblyToken']);
    Route::post('/assemblyai/transcribe', [CallsController::class, 'transcribe']);

    // CRUD resources
    Route::post('/admin/import-agents', [AgentsController::class, 'import']);
    Route::apiResource('agents/profiles', AgentsController::class);
    Route::apiResource('knowledge-base', KnowledgeBaseController::class);
    Route::apiResource('qa-overrides', QAOverrideController::class);
    Route::apiResource('live-analysis-logs', LiveAnalysisController::class);
});
