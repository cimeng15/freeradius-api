<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'client_id',
        'username',
        'pppoe_password',
        'package_id',
        'ip_address',
        'installation_address',
        'phone',
        'billing_date',
        'status',
    ];

    /**
     * Boot: auto-generate client_id on creating
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($client) {
            if (empty($client->client_id)) {
                $client->client_id = self::generateClientId();
            }
        });
    }

    /**
     * Generate unique 10-digit client ID with prefix 1985
     * Format: 1985XXXXXX (1985 + 6 random digits)
     */
    public static function generateClientId(): string
    {
        do {
            $id = '1985' . str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        } while (self::where('client_id', $id)->exists());

        return $id;
    }

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function package()
    {
        return $this->belongsTo(Package::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeSuspended($query)
    {
        return $query->where('status', 'suspended');
    }

    /**
     * Find client by client_id
     */
    public static function findByClientId(string $clientId): ?self
    {
        return self::where('client_id', $clientId)->first();
    }

    // Helper methods
    public function suspend()
    {
        $this->update(['status' => 'suspended']);
        
        // Disable in FreeRADIUS
        RadiusUser::where('username', $this->username)->delete();
    }

    public function activate()
    {
        $this->update(['status' => 'active']);
        
        // Re-enable in FreeRADIUS
        RadiusUser::createPPPoEUser($this->username, $this->user->password, $this->package);
    }

    public function terminate()
    {
        $this->update(['status' => 'terminated']);
        
        // Remove from FreeRADIUS
        RadiusUser::where('username', $this->username)->delete();
    }
}
