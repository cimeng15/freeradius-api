<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RadiusAccounting extends Model
{
    use HasFactory;

    protected $table = 'radacct';
    protected $primaryKey = 'radacctid';
    public $timestamps = false;

    protected $casts = [
        'acctstarttime' => 'datetime',
        'acctupdatetime' => 'datetime',
        'acctstoptime' => 'datetime',
    ];

    /**
     * Get active sessions
     */
    public static function getActiveSessions()
    {
        return self::whereNull('acctstoptime')
            ->orderBy('acctstarttime', 'desc')
            ->get();
    }

    /**
     * Get user session history
     */
    public static function getUserHistory($username, $limit = 10)
    {
        return self::where('username', $username)
            ->orderBy('acctstarttime', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get total usage for user
     */
    public static function getUserTotalUsage($username)
    {
        return self::where('username', $username)
            ->selectRaw('
                SUM(acctinputoctets) as total_download,
                SUM(acctoutputoctets) as total_upload,
                SUM(acctsessiontime) as total_time
            ')
            ->first();
    }

    /**
     * Disconnect user session
     */
    public static function disconnectUser($username)
    {
        return self::where('username', $username)
            ->whereNull('acctstoptime')
            ->update([
                'acctstoptime' => now(),
                'acctterminatecause' => 'Admin-Reset'
            ]);
    }

    /**
     * Format bytes to human readable
     */
    public function getFormattedDownloadAttribute()
    {
        return self::formatBytes($this->acctinputoctets);
    }

    public function getFormattedUploadAttribute()
    {
        return self::formatBytes($this->acctoutputoctets);
    }

    public static function formatBytes($bytes)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));
        
        return round($bytes, 2) . ' ' . $units[$pow];
    }
}
