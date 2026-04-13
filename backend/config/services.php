<?php

return [
    'ctm' => [
        'api_url'    => env('CTM_API_URL', 'https://api.calltrackingmetrics.com/api/v1'),
        'access_key' => env('CTM_ACCESS_KEY', ''),
        'secret_key' => env('CTM_SECRET_KEY', ''),
        'account_id' => env('CTM_ACCOUNT_ID', ''),
    ],

    'openrouter' => [
        'api_key' => env('OPENROUTER_API_KEY', ''),
        'api_url' => env('OPENROUTER_API_URL', 'https://openrouter.ai/api/v1'),
    ],

    'assemblyai' => [
        'api_key' => env('ASSEMBLYAI_API_KEY', ''),
        'api_url' => env('ASSEMBLYAI_API_URL', 'https://api.assemblyai.com'),
    ],
];
