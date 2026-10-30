<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SaleReturns extends Model
{
    protected $fillable = [
        'return_no',
        'sale_id',
        'user_id',
        'total_refund',
        'refund_method',
        'reason',
        'returned_at',
    ];

    protected $casts = [
        'total_refund' => 'decimal:2',
        'returned_at'  => 'datetime',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sales::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleReturnItems::class);
    }
}
