<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = ['key', 'value', 'type', 'group', 'label'];

    /**
     * Get setting value by key
     */
    public static function getValue(string $key, $default = null)
    {
        return Cache::remember("setting.{$key}", 3600, function () use ($key, $default) {
            $setting = self::where('key', $key)->first();
            return $setting ? $setting->value : $default;
        });
    }

    /**
     * Set setting value
     */
    public static function setValue(string $key, $value, string $type = 'string', string $group = 'general', string $label = null): self
    {
        Cache::forget("setting.{$key}");
        Cache::forget('settings.all');

        return self::updateOrCreate(
            ['key' => $key],
            ['value' => $value, 'type' => $type, 'group' => $group, 'label' => $label ?? $key]
        );
    }

    /**
     * Get all settings grouped
     */
    public static function getAllGrouped(): array
    {
        return Cache::remember('settings.all', 3600, function () {
            return self::all()
                ->groupBy('group')
                ->map(fn($items) => $items->pluck('value', 'key'))
                ->toArray();
        });
    }
}
