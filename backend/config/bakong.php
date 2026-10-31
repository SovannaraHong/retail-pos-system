<?php

return [

    // Bakong API
    'base_url' => env(
        'BAKONG_BASE_URL',
        'https://api-bakong.nbc.gov.kh'
    ),

    // Bakong Open API token
    'token' => env('BAKONG_TOKEN'),

    // Email registered with Bakong
    'email' => env('BAKONG_EMAIL'),

    // Bakong account receiving payments
    'account_id' => env('BAKONG_ACCOUNT_ID'),

    // individual or merchant
    'account_type' => env('BAKONG_ACCOUNT_TYPE', 'individual'),

    // Merchant information
    'merchant_name' => env('BAKONG_MERCHANT_NAME'),
    'merchant_city' => env('BAKONG_MERCHANT_CITY', 'Siem Reap'),
    'merchant_id' => env('BAKONG_MERCHANT_ID'),
    'acquiring_bank' => env('BAKONG_ACQUIRING_BANK'),

    // Payment currency: USD or KHR
    'currency' => env('BAKONG_CURRENCY', 'USD'),

    // QR expiration
    'expire_minutes' => (int) env('BAKONG_EXPIRE_MINUTES', 5),

    // API timeout
    'timeout' => (int) env('BAKONG_TIMEOUT', 15),

];
