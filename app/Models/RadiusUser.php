<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RadiusUser extends Model
{
    use HasFactory;

    protected $table = 'radcheck';
    public $timestamps = false;

    protected $fillable = ['username', 'attribute', 'op', 'value'];

    /**
     * Create PPPoE user in FreeRADIUS
     */
    public static function createPPPoEUser($username, $password, $package)
    {
        // Insert password
        self::create([
            'username' => $username,
            'attribute' => 'Cleartext-Password',
            'op' => ':=',
            'value' => $password
        ]);

        // Insert rate limit
        RadiusReply::create([
            'username' => $username,
            'attribute' => 'Mikrotik-Rate-Limit',
            'op' => ':=',
            'value' => "{$package->speed_upload}M/{$package->speed_download}M"
        ]);

        // Insert to group
        RadiusUserGroup::create([
            'username' => $username,
            'groupname' => 'pppoe_users',
            'priority' => 1
        ]);

        AuditLog::log('create_pppoe_user', 'radcheck', null, null, [
            'username' => $username,
            'package' => $package->name
        ]);
    }

    /**
     * Create Hotspot voucher in FreeRADIUS
     */
    public static function createVoucher($code, $package)
    {
        // Insert voucher code as password
        self::create([
            'username' => $code,
            'attribute' => 'Cleartext-Password',
            'op' => ':=',
            'value' => $code
        ]);

        // Session timeout (in seconds)
        if ($package->duration) {
            $timeout = $package->duration * 24 * 3600;
            self::create([
                'username' => $code,
                'attribute' => 'Session-Timeout',
                'op' => ':=',
                'value' => $timeout
            ]);
        }

        // Rate limit
        RadiusReply::create([
            'username' => $code,
            'attribute' => 'Mikrotik-Rate-Limit',
            'op' => ':=',
            'value' => "{$package->speed_upload}M/{$package->speed_download}M"
        ]);

        // Add to hotspot group
        RadiusUserGroup::create([
            'username' => $code,
            'groupname' => 'hotspot_users',
            'priority' => 1
        ]);

        AuditLog::log('create_voucher', 'radcheck', null, null, [
            'code' => $code,
            'package' => $package->name
        ]);
    }

    /**
     * Update user password
     */
    public static function updatePassword($username, $newPassword)
    {
        self::where('username', $username)
            ->where('attribute', 'Cleartext-Password')
            ->update(['value' => $newPassword]);

        AuditLog::log('update_radius_password', 'radcheck', null, null, [
            'username' => $username
        ]);
    }

    /**
     * Delete user from FreeRADIUS
     */
    public static function deleteUser($username)
    {
        self::where('username', $username)->delete();
        RadiusReply::where('username', $username)->delete();
        RadiusUserGroup::where('username', $username)->delete();

        AuditLog::log('delete_radius_user', 'radcheck', null, null, [
            'username' => $username
        ]);
    }
}
