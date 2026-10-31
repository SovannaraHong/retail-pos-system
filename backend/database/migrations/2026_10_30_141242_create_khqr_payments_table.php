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
        Schema::create('khqr_payments', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 30)->unique();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('sale_id')->nullable()->constrained()->nullOnDelete();


            // pending, paid, expired, cancelled, failed, needs_review
            $table->string('status', 20)->default('pending');


            $table->decimal('amount', 12, 2);
            $table->string('currency', 3);
            $table->text('qr');                                    // the KHQR string the app draws
            $table->string('md5', 32)->unique();                   // Bakong finds the payment by this
            $table->json('cart');

            $table->timestamp('expires_at');
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('last_checked_at')->nullable();



            $table->string('bakong_hash')->nullable()->unique();   // one bank transaction can settle only one payment
            $table->string('from_account')->nullable();            // payer's Bakong account
            $table->json('bakong_response')->nullable();
            $table->text('error')->nullable();
            $table->timestamps();

            $table->index(['status', 'expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('khqr_payments');
    }
};
