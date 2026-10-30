<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customers extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['name', 'phone', 'email', 'address', 'points', 'note', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
        'points' => 'integer'
    ];


    public function sales(): HasMany
    {
        return $this->hasMany(Sales::class);
    }
}
