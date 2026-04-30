<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('packages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['pppoe', 'hotspot']);
            $table->integer('speed_download'); // in Mbps
            $table->integer('speed_upload'); // in Mbps
            $table->integer('quota')->nullable(); // in GB, null = unlimited
            $table->integer('duration')->nullable(); // in days, for hotspot
            $table->decimal('price', 10, 2);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('packages');
    }
};
