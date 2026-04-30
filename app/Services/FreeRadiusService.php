<?php

namespace App\Services;

use App\Models\RadiusNas;
use App\Models\RadiusUser;
use App\Models\RadiusReply;
use App\Models\RadiusUserGroup;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FreeRadiusService
{
    /**
     * Create FreeRADIUS user with rate limit
     */
    public function createUser(string $username, string $password, string $speedProfile): bool
    {
        try {
            DB::beginTransaction();

            // Create radcheck entry (authentication)
            RadiusUser::create([
                'username' => $username,
                'attribute' => 'Cleartext-Password',
                'op' => ':=',
                'value' => $password,
            ]);

            // Parse speed profile (e.g., "10M/10M")
            [$downloadSpeed, $uploadSpeed] = $this->parseSpeedProfile($speedProfile);

            // Create radreply entries (rate limit)
            RadiusReply::create([
                'username' => $username,
                'attribute' => 'Mikrotik-Rate-Limit',
                'op' => '=',
                'value' => "{$uploadSpeed}k/{$downloadSpeed}k",
            ]);

            DB::commit();
            Log::info("FreeRADIUS user created: {$username}");
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to create FreeRADIUS user: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Update FreeRADIUS user password
     */
    public function updatePassword(string $username, string $newPassword): bool
    {
        try {
            RadiusUser::where('username', $username)
                ->where('attribute', 'Cleartext-Password')
                ->update(['value' => $newPassword]);

            Log::info("FreeRADIUS password updated: {$username}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to update FreeRADIUS password: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Update FreeRADIUS user rate limit
     */
    public function updateRateLimit(string $username, string $speedProfile): bool
    {
        try {
            [$downloadSpeed, $uploadSpeed] = $this->parseSpeedProfile($speedProfile);

            RadiusReply::updateOrCreate(
                [
                    'username' => $username,
                    'attribute' => 'Mikrotik-Rate-Limit',
                ],
                [
                    'op' => '=',
                    'value' => "{$uploadSpeed}k/{$downloadSpeed}k",
                ]
            );

            Log::info("FreeRADIUS rate limit updated: {$username}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to update FreeRADIUS rate limit: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Delete FreeRADIUS user
     */
    public function deleteUser(string $username): bool
    {
        try {
            DB::beginTransaction();

            RadiusUser::where('username', $username)->delete();
            RadiusReply::where('username', $username)->delete();
            RadiusUserGroup::where('username', $username)->delete();

            DB::commit();
            Log::info("FreeRADIUS user deleted: {$username}");
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to delete FreeRADIUS user: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Suspend user (disable authentication)
     */
    public function suspendUser(string $username): bool
    {
        try {
            // Change password to random string to prevent login
            RadiusUser::where('username', $username)
                ->where('attribute', 'Cleartext-Password')
                ->update(['value' => 'SUSPENDED_' . bin2hex(random_bytes(16))]);

            Log::info("FreeRADIUS user suspended: {$username}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to suspend FreeRADIUS user: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Activate user (restore password)
     */
    public function activateUser(string $username, string $password): bool
    {
        try {
            RadiusUser::where('username', $username)
                ->where('attribute', 'Cleartext-Password')
                ->update(['value' => $password]);

            Log::info("FreeRADIUS user activated: {$username}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to activate FreeRADIUS user: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Add router to FreeRADIUS NAS table
     */
    public function addNas(string $name, string $ipAddress, string $secret, string $type = 'mikrotik'): bool
    {
        try {
            RadiusNas::create([
                'nasname' => $ipAddress,
                'shortname' => $name,
                'type' => $type,
                'secret' => $secret,
                'description' => "Added via panel",
            ]);

            Log::info("FreeRADIUS NAS added: {$name} ({$ipAddress})");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to add FreeRADIUS NAS: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Update router in FreeRADIUS NAS table
     */
    public function updateNas(string $oldIpAddress, string $name, string $newIpAddress, string $secret): bool
    {
        try {
            RadiusNas::where('nasname', $oldIpAddress)->update([
                'nasname' => $newIpAddress,
                'shortname' => $name,
                'secret' => $secret,
            ]);

            Log::info("FreeRADIUS NAS updated: {$name}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to update FreeRADIUS NAS: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Delete router from FreeRADIUS NAS table
     */
    public function deleteNas(string $ipAddress): bool
    {
        try {
            RadiusNas::where('nasname', $ipAddress)->delete();

            Log::info("FreeRADIUS NAS deleted: {$ipAddress}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to delete FreeRADIUS NAS: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Parse speed profile string (e.g., "10M/10M" -> [10240, 10240])
     */
    private function parseSpeedProfile(string $speedProfile): array
    {
        // Format: "10M/10M" or "512K/1M"
        $parts = explode('/', $speedProfile);
        
        $download = $this->convertToKbps($parts[0] ?? '1M');
        $upload = $this->convertToKbps($parts[1] ?? '1M');

        return [$download, $upload];
    }

    /**
     * Convert speed string to Kbps (e.g., "10M" -> 10240, "512K" -> 512)
     */
    private function convertToKbps(string $speed): int
    {
        $speed = strtoupper(trim($speed));
        
        if (str_ends_with($speed, 'M')) {
            return (int) rtrim($speed, 'M') * 1024;
        } elseif (str_ends_with($speed, 'K')) {
            return (int) rtrim($speed, 'K');
        } elseif (str_ends_with($speed, 'G')) {
            return (int) rtrim($speed, 'G') * 1024 * 1024;
        }

        // Default to Kbps
        return (int) $speed;
    }

    /**
     * Get online users count
     */
    public function getOnlineUsersCount(): int
    {
        return DB::table('radacct')
            ->whereNull('acctstoptime')
            ->count();
    }

    /**
     * Get total bandwidth usage today
     */
    public function getTodayBandwidth(): array
    {
        $today = now()->startOfDay();

        $result = DB::table('radacct')
            ->where('acctstarttime', '>=', $today)
            ->selectRaw('
                SUM(acctinputoctets) as total_download,
                SUM(acctoutputoctets) as total_upload
            ')
            ->first();

        return [
            'download' => $result->total_download ?? 0,
            'upload' => $result->total_upload ?? 0,
            'total' => ($result->total_download ?? 0) + ($result->total_upload ?? 0),
        ];
    }

    /**
     * Get user session history
     */
    public function getUserSessions(string $username, int $limit = 10)
    {
        return DB::table('radacct')
            ->where('username', $username)
            ->orderBy('acctstarttime', 'desc')
            ->limit($limit)
            ->get();
    }
}
