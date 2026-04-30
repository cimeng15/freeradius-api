<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class SettingsController extends Controller
{
    /**
     * Public: get app branding (name, logo, description)
     * No auth required — used by login pages
     */
    public function public()
    {
        $keys = ['app_name', 'app_description', 'app_logo', 'company_name'];
        $settings = Setting::whereIn('key', $keys)->pluck('value', 'key');

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    /**
     * Get all settings
     */
    public function index()
    {
        $settings = Setting::all()->groupBy('group');

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    /**
     * Get settings by group
     */
    public function group($group)
    {
        $settings = Setting::where('group', $group)->get()->pluck('value', 'key');

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    /**
     * Update settings (batch)
     */
    public function update(Request $request)
    {
        $settings = $request->input('settings', []);

        foreach ($settings as $key => $value) {
            Setting::setValue($key, $value);
        }

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan berhasil disimpan',
        ]);
    }

    /**
     * Update general settings (app name, description, etc)
     */
    public function updateGeneral(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'app_name' => 'required|string|max:100',
            'app_description' => 'nullable|string|max:255',
            'company_name' => 'nullable|string|max:100',
            'company_address' => 'nullable|string|max:500',
            'company_phone' => 'nullable|string|max:20',
            'company_email' => 'nullable|string|email|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $fields = ['app_name', 'app_description', 'company_name', 'company_address', 'company_phone', 'company_email'];
        
        foreach ($fields as $field) {
            if ($request->has($field)) {
                Setting::setValue($field, $request->input($field), 'string', 'general', ucwords(str_replace('_', ' ', $field)));
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan umum berhasil disimpan',
        ]);
    }

    /**
     * Upload logo
     */
    public function uploadLogo(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'logo' => 'required|image|mimes:png,jpg,jpeg,svg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $file = $request->file('logo');
        $filename = 'logo_' . time() . '.' . $file->getClientOriginalExtension();
        
        // Store in public storage
        $path = $file->storeAs('logos', $filename, 'public');

        // Delete old logo if exists
        $oldLogo = Setting::getValue('app_logo');
        if ($oldLogo && Storage::disk('public')->exists($oldLogo)) {
            Storage::disk('public')->delete($oldLogo);
        }

        Setting::setValue('app_logo', $path, 'file', 'appearance', 'App Logo');

        return response()->json([
            'success' => true,
            'message' => 'Logo berhasil diupload',
            'data' => [
                'path' => $path,
                'url' => '/storage/' . $path,
            ],
        ]);
    }

    /**
     * Update license settings
     */
    public function updateLicense(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'license_key' => 'nullable|string|max:255',
            'license_type' => 'nullable|string|in:trial,basic,pro,enterprise',
            'license_expiry' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $fields = ['license_key', 'license_type', 'license_expiry'];
        foreach ($fields as $field) {
            if ($request->has($field)) {
                Setting::setValue($field, $request->input($field), 'string', 'license', ucwords(str_replace('_', ' ', $field)));
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Lisensi berhasil disimpan',
        ]);
    }

    /**
     * Ping tool - test connectivity to an IP/host
     */
    public function ping(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'host' => 'required|string|max:255',
            'count' => 'nullable|integer|min:1|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $host = $request->input('host');
        $count = $request->input('count', 4);

        // Sanitize host input (prevent command injection)
        $host = escapeshellarg($host);

        // Detect OS for ping command
        $isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
        $countFlag = $isWindows ? '-n' : '-c';
        $timeoutFlag = $isWindows ? '-w 2000' : '-W 2';

        $command = "ping {$countFlag} {$count} {$timeoutFlag} {$host} 2>&1";
        
        $startTime = microtime(true);
        $output = [];
        $returnVar = 0;
        exec($command, $output, $returnVar);
        $duration = round((microtime(true) - $startTime) * 1000);

        $outputText = implode("\n", $output);
        $isReachable = $returnVar === 0;

        // Parse ping statistics
        $stats = $this->parsePingStats($outputText);

        return response()->json([
            'success' => true,
            'data' => [
                'host' => trim($host, "'\""),
                'reachable' => $isReachable,
                'duration_ms' => $duration,
                'output' => $outputText,
                'stats' => $stats,
            ],
        ]);
    }

    /**
     * Traceroute tool
     */
    public function traceroute(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'host' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $host = escapeshellarg($request->input('host'));
        
        $isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
        $command = $isWindows ? "tracert -d -w 2000 {$host} 2>&1" : "traceroute -n -w 2 -m 15 {$host} 2>&1";

        $output = [];
        exec($command, $output, $returnVar);

        return response()->json([
            'success' => true,
            'data' => [
                'host' => trim($host, "'\""),
                'output' => implode("\n", $output),
            ],
        ]);
    }

    /**
     * Get system info
     */
    public function systemInfo()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'os' => PHP_OS,
                'server_time' => now()->format('Y-m-d H:i:s'),
                'timezone' => config('app.timezone'),
                'disk_free' => $this->formatBytes(disk_free_space('/')),
                'disk_total' => $this->formatBytes(disk_total_space('/')),
                'memory_usage' => $this->formatBytes(memory_get_usage(true)),
                'uptime' => $this->getUptime(),
            ],
        ]);
    }

    /**
     * Parse ping output for statistics
     */
    private function parsePingStats(string $output): array
    {
        $stats = [
            'packets_sent' => 0,
            'packets_received' => 0,
            'packet_loss' => '100%',
            'min_ms' => null,
            'avg_ms' => null,
            'max_ms' => null,
        ];

        // Parse packet stats
        if (preg_match('/(\d+) packets transmitted.*?(\d+) (?:packets )?received.*?(\d+(?:\.\d+)?%) packet loss/s', $output, $m)) {
            $stats['packets_sent'] = (int)$m[1];
            $stats['packets_received'] = (int)$m[2];
            $stats['packet_loss'] = $m[3];
        }

        // Parse time stats (macOS/Linux format)
        if (preg_match('/min\/avg\/max\/(?:mdev|stddev) = ([\d.]+)\/([\d.]+)\/([\d.]+)/', $output, $m)) {
            $stats['min_ms'] = round((float)$m[1], 2);
            $stats['avg_ms'] = round((float)$m[2], 2);
            $stats['max_ms'] = round((float)$m[3], 2);
        }

        return $stats;
    }

    private function formatBytes($bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        return round($bytes, 2) . ' ' . $units[$i];
    }

    private function getUptime(): string
    {
        if (PHP_OS === 'Darwin' || PHP_OS === 'Linux') {
            $uptime = shell_exec('uptime 2>/dev/null');
            return trim($uptime) ?: 'N/A';
        }
        return 'N/A';
    }
}
