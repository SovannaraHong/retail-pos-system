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
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete(); // cashier
            $table->decimal('opening_cash', 12, 2)->default(0);
            $table->decimal('closing_cash', 12, 2)->nullable();   // counted by cashier
            $table->decimal('expected_cash', 12, 2)->nullable();  // calculated by system
            $table->decimal('difference', 12, 2)->nullable();     // closing - expected

            $table->string('status', 20)->default('open');        // open, closed
            $table->text('note')->nullable();
            $table->timestamp('opened_at')->useCurrent();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
