<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Voucher extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'package_id',
        'reseller_id',
        'batch_id',
        'status',
        'used_by',
        'used_at',
        'expires_at',
    ];

    protected $casts = [
        'used_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    // Relationships
    public function package()
    {
        return $this->belongsTo(Package::class);
    }

    public function reseller()
    {
        return $this->belongsTo(Reseller::class);
    }

    // Scopes
    public function scopeUnused($query)
    {
        return $query->where('status', 'unused');
    }

    public function scopeUsed($query)
    {
        return $query->where('status', 'used');
    }

    public function scopeExpired($query)
    {
        return $query->where('status', 'expired');
    }

    public function scopeByBatch($query, $batchId)
    {
        return $query->where('batch_id', $batchId);
    }

    // Helper methods
    public static function generateCode($length = 8)
    {
        do {
            $code = strtoupper(Str::random($length));
        } while (self::where('code', $code)->exists());

        return $code;
    }

    public static function generateBatch($packageId, $quantity, $resellerId = null)
    {
        $batchId = Str::uuid();
        $vouchers = [];
        $package = Package::findOrFail($packageId);

        for ($i = 0; $i < $quantity; $i++) {
            $code = self::generateCode();
            
            $voucher = self::create([
                'code' => $code,
                'package_id' => $packageId,
                'reseller_id' => $resellerId,
                'batch_id' => $batchId,
                'expires_at' => now()->addDays($package->duration ?? 30),
            ]);

            // Create in FreeRADIUS
            RadiusUser::createVoucher($code, $package);

            $vouchers[] = $voucher;
        }

        return [
            'batch_id' => $batchId,
            'vouchers' => $vouchers,
        ];
    }

    public function markAsUsed($username)
    {
        $this->update([
            'status' => 'used',
            'used_by' => $username,
            'used_at' => now(),
        ]);
    }

    public function isExpired()
    {
        return $this->expires_at && $this->expires_at->isPast();
    }
}
