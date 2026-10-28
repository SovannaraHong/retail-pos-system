<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class StockMovement extends Model
{
    protected $fillable = [
        'product_id',
        'user_id',
        'type',
        'qty_change',
        'qty_before',
        'qty_after',
        'reference_type',
        'reference_id',
        'note',
    ];

    protected $casts = [
        'qty_change' => 'decimal:3',
        'qty_before' => 'decimal:3',
        'qty_after'  => 'decimal:3',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Products::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // the sale / purchase / return that caused this movement
    public function reference(): MorphTo
    {
        return $this->morphTo();
    }
}
