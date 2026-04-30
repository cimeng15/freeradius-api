<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Package extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'speed_download',
        'speed_upload',
        'quota',
        'duration',
        'uptime_limit',      // minutes (hotspot: total waktu online)
        'expire_after',      // days (hotspot: expire setelah first login)
        'price',
        'reseller_commission', // nominal Rp (komisi per voucher)
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'price' => 'decimal:2',
        'reseller_commission' => 'decimal:2',
    ];

    // Relationships
    public function clients()
    {
        return $this->hasMany(Client::class);
    }

    public function vouchers()
    {
        return $this->hasMany(Voucher::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopePppoe($query)
    {
        return $query->where('type', 'pppoe');
    }

    public function scopeHotspot($query)
    {
        return $query->where('type', 'hotspot');
    }

    // Helper methods
    public function getRateLimitAttribute()
    {
        return "{$this->speed_upload}M/{$this->speed_download}M";
    }

    public function getFormattedPriceAttribute()
    {
        return 'Rp ' . number_format($this->price, 0, ',', '.');
    }

    /**
     * Harga untuk reseller (price - commission)
     */
    public function getResellerPriceAttribute()
    {
        return max(0, $this->price - ($this->reseller_commission ?? 0));
    }

    /**
     * Format uptime limit untuk display (e.g., "15 Jam")
     */
    public function getFormattedUptimeAttribute()
    {
        if (!$this->uptime_limit) return 'Unlimited';
        $hours = floor($this->uptime_limit / 60);
        $mins = $this->uptime_limit % 60;
        if ($hours > 0 && $mins > 0) return "{$hours} Jam {$mins} Menit";
        if ($hours > 0) return "{$hours} Jam";
        return "{$mins} Menit";
    }
}
