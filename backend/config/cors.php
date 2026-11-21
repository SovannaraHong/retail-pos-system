<?php

return [
    'paths' => [
        'api/*',
        'login',
        'logout',
        'register',
        'refresh',
        'me',
    ],
    'allowed_methods' => ['*'],


    'allowed_origins' => array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,https://hongsovannara.store,https://www.hongsovannara.store,https://retail-pos-system-drab-two.vercel.app')))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
