<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // radcheck - User authentication
        Schema::create('radcheck', function (Blueprint $table) {
            $table->id();
            $table->string('username', 64)->index();
            $table->string('attribute', 64);
            $table->string('op', 2)->default('==');
            $table->string('value', 253);
            $table->timestamps();
        });

        // radreply - User reply attributes (rate limit, etc)
        Schema::create('radreply', function (Blueprint $table) {
            $table->id();
            $table->string('username', 64)->index();
            $table->string('attribute', 64);
            $table->string('op', 2)->default('=');
            $table->string('value', 253);
            $table->timestamps();
        });

        // radgroupcheck - Group check attributes
        Schema::create('radgroupcheck', function (Blueprint $table) {
            $table->id();
            $table->string('groupname', 64)->index();
            $table->string('attribute', 64);
            $table->string('op', 2)->default('==');
            $table->string('value', 253);
            $table->timestamps();
        });

        // radgroupreply - Group reply attributes
        Schema::create('radgroupreply', function (Blueprint $table) {
            $table->id();
            $table->string('groupname', 64)->index();
            $table->string('attribute', 64);
            $table->string('op', 2)->default('=');
            $table->string('value', 253);
            $table->timestamps();
        });

        // radusergroup - User to group mapping
        Schema::create('radusergroup', function (Blueprint $table) {
            $table->id();
            $table->string('username', 64)->index();
            $table->string('groupname', 64);
            $table->integer('priority')->default(1);
            $table->timestamps();
        });

        // nas - Network Access Servers (Mikrotik routers)
        Schema::create('nas', function (Blueprint $table) {
            $table->id();
            $table->string('nasname', 128)->unique();
            $table->string('shortname', 32);
            $table->string('type', 30)->default('other');
            $table->integer('ports')->nullable();
            $table->string('secret', 60);
            $table->string('server', 64)->nullable();
            $table->string('community', 50)->nullable();
            $table->string('description', 200)->nullable();
            $table->timestamps();
        });

        // radacct - Accounting (session logs)
        Schema::create('radacct', function (Blueprint $table) {
            $table->bigIncrements('radacctid');
            $table->string('acctsessionid', 64)->index();
            $table->string('acctuniqueid', 32)->unique();
            $table->string('username', 64)->index();
            $table->string('groupname', 64)->nullable();
            $table->string('realm', 64)->nullable();
            $table->string('nasipaddress', 15)->index();
            $table->string('nasportid', 32)->nullable();
            $table->string('nasporttype', 32)->nullable();
            $table->timestamp('acctstarttime')->nullable()->index();
            $table->timestamp('acctupdatetime')->nullable();
            $table->timestamp('acctstoptime')->nullable()->index();
            $table->integer('acctsessiontime')->unsigned()->nullable()->index();
            $table->string('acctauthentic', 32)->nullable();
            $table->string('connectinfo_start', 50)->nullable();
            $table->string('connectinfo_stop', 50)->nullable();
            $table->bigInteger('acctinputoctets')->unsigned()->nullable();
            $table->bigInteger('acctoutputoctets')->unsigned()->nullable();
            $table->string('calledstationid', 50)->nullable();
            $table->string('callingstationid', 50)->nullable();
            $table->string('acctterminatecause', 32)->nullable();
            $table->string('servicetype', 32)->nullable();
            $table->string('framedprotocol', 32)->nullable();
            $table->string('framedipaddress', 15)->nullable()->index();
            $table->integer('acctstartdelay')->unsigned()->nullable();
            $table->integer('acctstopdelay')->unsigned()->nullable();
            $table->string('xascendsessionsvrkey', 10)->nullable();
            
            $table->index(['username', 'nasipaddress']);
        });

        // radpostauth - Post authentication log
        Schema::create('radpostauth', function (Blueprint $table) {
            $table->id();
            $table->string('username', 64)->index();
            $table->string('pass', 64);
            $table->string('reply', 32);
            $table->timestamp('authdate')->useCurrent();
            $table->string('nasipaddress', 15)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('radpostauth');
        Schema::dropIfExists('radacct');
        Schema::dropIfExists('nas');
        Schema::dropIfExists('radusergroup');
        Schema::dropIfExists('radgroupreply');
        Schema::dropIfExists('radgroupcheck');
        Schema::dropIfExists('radreply');
        Schema::dropIfExists('radcheck');
    }
};
