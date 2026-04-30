<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Client;
use App\Models\Package;
use App\Models\Router;
use App\Models\Reseller;
use App\Models\Setting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create roles
        $roles = ['superadmin', 'noc', 'reseller', 'client'];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        // Create Superadmin
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Super Admin',
                'username' => 'admin',
                'password' => Hash::make('password'),
                'role' => 'superadmin',
                'status' => 'active',
            ]
        );
        $admin->assignRole('superadmin');

        // Create NOC
        $noc = User::firstOrCreate(
            ['email' => 'noc@example.com'],
            [
                'name' => 'NOC Operator',
                'username' => 'noc',
                'password' => Hash::make('password'),
                'role' => 'noc',
                'status' => 'active',
            ]
        );
        $noc->assignRole('noc');

        // Create Reseller User
        $resellerUser = User::firstOrCreate(
            ['email' => 'reseller@example.com'],
            [
                'name' => 'Reseller Demo',
                'username' => 'reseller',
                'password' => Hash::make('password'),
                'role' => 'reseller',
                'status' => 'active',
            ]
        );
        $resellerUser->assignRole('reseller');

        // Create Reseller Profile
        Reseller::firstOrCreate(
            ['user_id' => $resellerUser->id],
            [
                'balance' => 500000,
                'status' => 'active',
            ]
        );

        // Create Packages
        $packages = [
            // PPPoE packages (no hotspot fields)
            ['name' => 'Paket 5 Mbps', 'type' => 'pppoe', 'price' => 150000, 'speed_download' => 5, 'speed_upload' => 5, 'is_active' => true, 'description' => 'Paket internet 5 Mbps unlimited'],
            ['name' => 'Paket 10 Mbps', 'type' => 'pppoe', 'price' => 250000, 'speed_download' => 10, 'speed_upload' => 10, 'is_active' => true, 'description' => 'Paket internet 10 Mbps unlimited'],
            ['name' => 'Paket 20 Mbps', 'type' => 'pppoe', 'price' => 350000, 'speed_download' => 20, 'speed_upload' => 20, 'is_active' => true, 'description' => 'Paket internet 20 Mbps unlimited'],
            ['name' => 'Paket 50 Mbps', 'type' => 'pppoe', 'price' => 500000, 'speed_download' => 50, 'speed_upload' => 50, 'is_active' => true, 'description' => 'Paket internet 50 Mbps unlimited'],
            // Hotspot voucher packages (with uptime, expire, commission)
            ['name' => 'Voucher 3Mbps 15Jam/3Hari', 'type' => 'hotspot', 'price' => 5000, 'speed_download' => 3, 'speed_upload' => 3, 'uptime_limit' => 900, 'expire_after' => 3, 'reseller_commission' => 1000, 'is_active' => true, 'description' => 'Voucher 3 Mbps, uptime 15 jam, expire 3 hari'],
            ['name' => 'Voucher 5Mbps 15Jam/3Hari', 'type' => 'hotspot', 'price' => 10000, 'speed_download' => 5, 'speed_upload' => 5, 'uptime_limit' => 900, 'expire_after' => 3, 'reseller_commission' => 2000, 'is_active' => true, 'description' => 'Voucher 5 Mbps, uptime 15 jam, expire 3 hari'],
            ['name' => 'Voucher 10Mbps 30Jam/7Hari', 'type' => 'hotspot', 'price' => 25000, 'speed_download' => 10, 'speed_upload' => 10, 'uptime_limit' => 1800, 'expire_after' => 7, 'reseller_commission' => 5000, 'is_active' => true, 'description' => 'Voucher 10 Mbps, uptime 30 jam, expire 7 hari'],
        ];

        foreach ($packages as $pkg) {
            Package::firstOrCreate(['name' => $pkg['name']], $pkg);
        }

        // Create Sample Router
        Router::firstOrCreate(
            ['ip_address' => '192.168.1.1'],
            [
                'name' => 'Router Pusat',
                'secret' => 'radius123',
                'type' => 'both',
                'location' => 'Kantor Pusat',
                'status' => 'active',
            ]
        );

        // Create Demo Client PPPoE
        $clientUser = User::firstOrCreate(
            ['email' => 'client@example.com'],
            [
                'name' => 'Budi Santoso',
                'password' => Hash::make('password'),
                'role' => 'client',
                'status' => 'active',
            ]
        );
        $clientUser->assignRole('client');

        $demoClient = Client::firstOrCreate(
            ['user_id' => $clientUser->id],
            [
                'client_id' => '1985000001',
                'username' => 'budi-pppoe',
                'pppoe_password' => 'password',
                'package_id' => Package::where('type', 'pppoe')->first()->id ?? 1,
                'installation_address' => 'Jl. Merdeka No. 45, Jakarta Selatan',
                'phone' => '081234567890',
                'billing_date' => 5,
                'status' => 'active',
            ]
        );

        // Default Settings
        $defaultSettings = [
            ['key' => 'app_name', 'value' => 'RadiusBill', 'type' => 'string', 'group' => 'general', 'label' => 'Nama Aplikasi'],
            ['key' => 'app_description', 'value' => 'FreeRADIUS Billing System', 'type' => 'string', 'group' => 'general', 'label' => 'Deskripsi'],
            ['key' => 'company_name', 'value' => 'ISP Network', 'type' => 'string', 'group' => 'general', 'label' => 'Nama Perusahaan'],
            ['key' => 'company_address', 'value' => '', 'type' => 'text', 'group' => 'general', 'label' => 'Alamat'],
            ['key' => 'company_phone', 'value' => '', 'type' => 'string', 'group' => 'general', 'label' => 'Telepon'],
            ['key' => 'company_email', 'value' => '', 'type' => 'string', 'group' => 'general', 'label' => 'Email'],
            ['key' => 'app_logo', 'value' => null, 'type' => 'file', 'group' => 'appearance', 'label' => 'Logo'],
        ];

        foreach ($defaultSettings as $setting) {
            Setting::firstOrCreate(['key' => $setting['key']], $setting);
        }

        $this->command->info('✅ Database seeded successfully!');
        $this->command->info('');
        $this->command->info('   📧 Login Staff:');
        $this->command->info('   Admin: admin / password');
        $this->command->info('   NOC: noc / password');
        $this->command->info('   Reseller: reseller / password');
        $this->command->info('');
        $this->command->info('   🆔 Login Pelanggan (tanpa password):');
        $this->command->info("   Client: {$demoClient->client_id} atau 081234567890");
    }
}
