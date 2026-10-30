<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleReturnItems extends Model
{
    protected $fillable = [
        'sale_return_id',
        'sale_item_id',
        'product_id',
        'qty',
        'unit_price',
        'line_total',
        'restock',
    ];
    protected $casts = [
        'qty'        => 'decimal:3',
        'unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
        'restock'    => 'boolean',
    ];


    public function saleReturn(): BelongsTo
    {
        return $this->belongsTo(SaleReturns::class);
    }
    public function saleItem(): BelongsTo
    {
        return $this->belongsTo(SaleItems::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Products::class);
    }
}
