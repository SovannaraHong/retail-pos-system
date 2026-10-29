<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Purchases extends Model
{
    protected $fillable = [
        'reference_no',
        'supplier_id',
        'user_id',
        'status',
        'subtotal',
        'discount',
        'tax',
        'total',
        'paid_amount',
        'note',
        'purchased_at',
        'received_at',
    ];

    protected $casts = [
        'subtotal'     => 'decimal:2',
        'discount'     => 'decimal:2',
        'tax'          => 'decimal:2',
        'total'        => 'decimal:2',
        'paid_amount'  => 'decimal:2',
        'purchased_at' => 'date',
        'received_at'  => 'datetime',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Suppliers::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(Purchases_items::class, 'purchase_id', 'id');
    }
}
