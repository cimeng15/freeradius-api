<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class ResetPassword extends Command
{
    protected $signature = 'app:reset-password
                            {--user= : Username atau email}
                            {--password= : Password baru}';

    protected $description = 'Reset password user (untuk recovery jika lupa password)';

    public function handle()
    {
        $identity = $this->option('user') ?: $this->ask('Masukkan username atau email');
        $newPassword = $this->option('password') ?: $this->secret('Masukkan password baru (min 8 karakter)');

        if (strlen($newPassword) < 8) {
            $this->error('Password minimal 8 karakter!');
            return 1;
        }

        // Find user
        $user = User::where('username', $identity)
            ->orWhere('email', $identity)
            ->first();

        if (!$user) {
            $this->error("User '{$identity}' tidak ditemukan!");
            return 1;
        }

        $this->info("User ditemukan: {$user->name} ({$user->email}) - Role: {$user->role}");

        if (!$this->option('password') && !$this->confirm('Yakin reset password user ini?')) {
            $this->info('Dibatalkan.');
            return 0;
        }

        $user->update([
            'password' => Hash::make($newPassword),
        ]);

        $this->info("✅ Password berhasil direset untuk: {$user->name}");
        $this->info("   Username: {$user->username}");
        $this->info("   Email: {$user->email}");

        return 0;
    }
}
