
<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

// Existing Laravel command
Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Bakong KHQR payment reconciliation
Schedule::command('khqr:reconcile')
    ->everyMinute()
    ->withoutOverlapping();
