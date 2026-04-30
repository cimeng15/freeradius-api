<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['topup', 'voucher_purchase', 'payment', 'commission', 'refund']);
            $table->decimal('amount', 15, 2);
            $table->text('description');
            $table->enum('status', ['pending', 'success', 'failed', 'cancelled'])->default('pending');
            $table->string('payment_method')->nullable();
            $table->string('payment_proof')->nullable(); // file path
            $table->string('reference_id')->nullable(); // external payment reference
            $table->timestamps();
            
            $table->index('type');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
