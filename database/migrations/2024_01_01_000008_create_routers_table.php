<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('routers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('ip_address');
            $table->string('secret'); // RADIUS shared secret
            $table->enum('type', ['hotspot', 'pppoe', 'both'])->default('both');
            $table->string('location')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
            
            $table->unique('ip_address');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('routers');
    }
};
