<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // initial, purchase, sale, return, adjustment, damage
            $table->string('type', 30);
            $table->decimal('qty_change', 12, 3);  // + in, - out
            $table->decimal('qty_before', 12, 3);
            $table->decimal('qty_after', 12, 3);

            // points to the sale, purchase, return... that caused it
            $table->nullableMorphs('reference');
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['product_id', 'created_at']);
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
