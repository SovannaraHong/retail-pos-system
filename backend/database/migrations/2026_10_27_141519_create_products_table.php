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
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('brand_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();

            $table->string('name');
            $table->string('sku')->unique();
            $table->string('barcode')->nullable()->unique();
            $table->text('description')->nullable();
            $table->string('image')->nullable(); // S3 path
            $table->string('unit', 20)->default('pcs');


            $table->decimal('cost_price', 12, 2)->default(0);
            $table->decimal('sell_price', 12, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(0); // percent, e.g. 10.00



            $table->boolean('track_stock')->default(true);
            $table->decimal('stock_qty', 12, 3)->default(0);
            $table->decimal('reorder_level', 12, 3)->default(0);


            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
