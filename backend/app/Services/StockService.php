<?php

namespace App\Services;

use App\Models\Products;
use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;


class StockService
{
    public function move(
        int $productId,
        string $type,            // initial, purchase, sale, return, adjustment, damage
        float $qtyChange,        // + adds stock, - removes stock
        ?int $userId = null,
        ?Model $reference = null, // the purchase / sale / return that caused it
        ?string $note = null,
        bool $allowNegative = false,
    ): ?StockMovement {
        $product = Products::withTrashed()->lockForUpdate()->findOrFail($productId);

        // services or items without stock tracking: nothing to change
        if (! $product->track_stock) {
            return null;
        }

        $before = round((float) $product->stock_qty, 3); //stock_qty =current stock
        $after  = round($before + $qtyChange, 3); // qty= stock qty change it mean current stock + stock change

        if ($after < 0 && ! $allowNegative) {
            throw ValidationException::withMessages([
                'stock' => ["Not enough stock for {$product->name} (available: {$before})."],
            ]);
        }

        $product->stock_qty = $after;
        $product->save();

        return StockMovement::create([
            'product_id'     => $product->id,
            'user_id'        => $userId,
            'type'           => $type,
            'qty_change'     => round($qtyChange, 3),
            'qty_before'     => $before,
            'qty_after'      => $after,
            'reference_type' => $reference?->getMorphClass(),
            'reference_id'   => $reference?->getKey(),
            'note'           => $note,
        ]);
    }
}
