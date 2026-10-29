<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Purchases_items extends Model
{
    protected $fillable = ['purchase_id', 'product_id', 'qty', 'unit_cost', 'line_total'];
    protected $casts = [
        'qty'        => 'decimal:3',
        'unit_cost'  => 'decimal:2',
        'line_total' => 'decimal:2',
    ];
    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchases::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Products::class);
    }
}
