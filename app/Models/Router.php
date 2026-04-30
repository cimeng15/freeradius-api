<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Router extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'ip_address',
        'secret',
        'type',
        'location',
        'status',
    ];

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    // Helper methods
    public function syncToFreeRADIUS()
    {
        // Check if already exists
        $nas = RadiusNas::where('nasname', $this->ip_address)->first();

        if ($nas) {
            // Update existing
            $nas->update([
                'shortname' => $this->name,
                'secret' => $this->secret,
                'description' => $this->location,
            ]);
        } else {
            // Create new
            RadiusNas::create([
                'nasname' => $this->ip_address,
                'shortname' => $this->name,
                'type' => 'mikrotik',
                'secret' => $this->secret,
                'description' => $this->location,
            ]);
        }
    }

    public function removeFromFreeRADIUS()
    {
        RadiusNas::where('nasname', $this->ip_address)->delete();
    }

    protected static function boot()
    {
        parent::boot();

        static::created(function ($router) {
            $router->syncToFreeRADIUS();
        });

        static::updated(function ($router) {
            $router->syncToFreeRADIUS();
        });

        static::deleted(function ($router) {
            $router->removeFromFreeRADIUS();
        });
    }
}
