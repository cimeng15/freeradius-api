<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('username')->unique(); // for PPPoE
            $table->foreignId('package_id')->constrained()->onDelete('restrict');
            $table->string('ip_address')->nullable(); // static IP
            $table->text('installation_address');
            $table->string('phone', 20);
            $table->integer('billing_date')->default(1); // 1-31
            $table->enum('status', ['active', 'suspended', 'terminated'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
