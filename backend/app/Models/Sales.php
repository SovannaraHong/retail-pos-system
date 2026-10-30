<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sales extends Model
{
    protected $fillable = [
        'invoice_no',
        'user_id',
        'customer_id',
        'shift_id',
        'subtotal',
        'discount',
        'tax',
        'total',
        'paid_amount',
        'change_amount',
        'status',
        'note',
        'sold_at'
    ];

    protected $casts = [
        'subtotal'      => 'decimal:2',
        'discount'      => 'decimal:2',
        'tax'           => 'decimal:2',
        'total'         => 'decimal:2',
        'paid_amount'   => 'decimal:2',
        'change_amount' => 'decimal:2',
        'sold_at'       => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customers::class);
    }
    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shifts::class);
    }


    public function items(): HasMany
    {
        return $this->hasMany(SaleItems::class, 'sale_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payments::class, 'sale_id');
    }

    public function returns(): HasMany
    {
        return $this->hasMany(SaleReturns::class, 'sale_id');
    }
}
