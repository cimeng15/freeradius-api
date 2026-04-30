<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            // Hotspot-specific fields
            $table->integer('uptime_limit')->nullable()->after('duration'); // in minutes (e.g., 900 = 15 jam)
            $table->integer('expire_after')->nullable()->after('uptime_limit'); // in days after first login
            
            // Reseller commission (nominal, bukan persen) - per paket voucher
            $table->decimal('reseller_commission', 10, 2)->default(0)->after('price'); // nominal Rp
            
            // Harga jual reseller = price - reseller_commission
        });

        // Remove commission_rate from resellers (pindah ke packages)
        Schema::table('resellers', function (Blueprint $table) {
            $table->dropColumn('commission_rate');
        });

        // Add password visibility to clients
        Schema::table('clients', function (Blueprint $table) {
            $table->string('pppoe_password')->nullable()->after('username'); // store cleartext for display
        });
    }

    public function down(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            $table->dropColumn(['uptime_limit', 'expire_after', 'reseller_commission']);
        });

        Schema::table('resellers', function (Blueprint $table) {
            $table->decimal('commission_rate', 5, 2)->default(0)->after('balance');
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn('pppoe_password');
        });
    }
};
