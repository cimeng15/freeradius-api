<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('package_id')->constrained()->onDelete('restrict');
            $table->foreignId('reseller_id')->nullable()->constrained()->onDelete('set null');
            $table->string('batch_id')->nullable(); // for bulk generation
            $table->enum('status', ['unused', 'used', 'expired'])->default('unused');
            $table->string('used_by')->nullable(); // username
            $table->timestamp('used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            
            $table->index('batch_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};
