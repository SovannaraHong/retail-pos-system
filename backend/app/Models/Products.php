<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Products extends Model
{

    use SoftDeletes;
    protected $fillable = [
        'category_id',
        'brand_id',
        'supplier_id',
        'name',
        'sku',
        'barcode',
        'description',
        'image',
        'unit',
        'cost_price',
        'sell_price',
        'tax_rate',
        'track_stock',
        'stock_qty',
        'reorder_level',
        'is_active',
    ];

    protected $appends = ['image_url'];

    protected $casts = [
        'cost_price'    => 'decimal:2',
        'sell_price'    => 'decimal:2',
        'tax_rate'      => 'decimal:2',
        'stock_qty'     => 'decimal:3',
        'reorder_level' => 'decimal:3',
        'track_stock'   => 'boolean',
        'is_active'     => 'boolean',
    ];

    public function imageUrl(): Attribute
    {
        return Attribute::get(fn() => $this->image ? Storage::url($this->image) : null);
    }
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brands::class);
    }
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Suppliers::class);
    }
    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'product_id');
    }
    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItems::class, 'product_id');
    }


    // products at or below their reorder level
    public function scopeLowStock($query)
    {
        return $query->where('track_stock', true)
            ->whereColumn('stock_qty', '<=', 'reorder_level');
    }
}
