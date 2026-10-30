<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItems extends Model
{

    protected $fillable = [
        'sale_id',
        'product_id',
        'product_name',
        'sku',
        'qty',
        'unit_price',
        'cost_price',
        'discount',
        'tax',
        'line_total',
    ];

    protected $casts = [
        'qty'        => 'decimal:3',
        'unit_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'discount'   => 'decimal:2',
        'tax'        => 'decimal:2',
        'line_total' => 'decimal:2',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sales::class, 'sale_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Products::class);
    }
}
