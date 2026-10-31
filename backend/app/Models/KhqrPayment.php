<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KhqrPayment extends Model
{
    protected $fillable = [
        'reference',
        'user_id',
        'sale_id',
        'status',
        'amount',
        'currency',
        'qr',
        'md5',
        'cart',
        'expires_at',
        'paid_at',
        'last_checked_at',
        'bakong_hash',
        'from_account',
        'bakong_response',
        'error',
    ];

    protected $casts = [
        'amount'          => 'decimal:2',
        'cart'            => 'array',
        'bakong_response' => 'array',
        'expires_at'      => 'datetime',
        'paid_at'         => 'datetime',
        'last_checked_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sales::class);
    }
}
