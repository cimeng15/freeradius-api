<?php

namespace App\Http\Controllers;

use App\Models\RadiusAccounting;
use App\Models\Client;
use App\Models\Voucher;
use App\Services\FreeRadiusService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class MonitoringController extends Controller
{
    protected $radiusService;

    public function __construct(FreeRadiusService $radiusService)
    {
        $this->radiusService = $radiusService;
    }

    /**
     * Get online users (active sessions)
     */
    public function onlineUsers(Request $request)
    {
        $query = RadiusAccounting::whereNull('acctstoptime')
            ->with(['client' => function ($q) {
                $q->select('id', 'username', 'package_id', 'router_id')
                    ->with(['package:id,name,type', 'router:id,name']);
            }])
            ->orderBy('acctstarttime', 'desc');

        // Search by username
        if ($request->has('search')) {
            $query->where('username', 'like', "%{$request->search}%");
        }

        // Filter by NAS (router)
        if ($request->has('nasipaddress')) {
            $query->where('nasipaddress', $request->nasipaddress);
        }

        $sessions = $query->paginate(20);

        // Calculate session duration and format data
        $sessions->getCollection()->transform(function ($session) {
            $duration = now()->diffInSeconds($session->acctstarttime);
            
            return [
                'username' => $session->username,
                'nas_ip' => $session->nasipaddress,
                'framed_ip' => $session->framedipaddress,
                'session_id' => $session->acctsessionid,
                'start_time' => $session->acctstarttime,
                'duration_seconds' => $duration,
                'duration_formatted' => $this->formatDuration($duration),
                'download_bytes' => $session->acctinputoctets,
                'upload_bytes' => $session->acctoutputoctets,
                'download_formatted' => $this->formatBytes($session->acctinputoctets),
                'upload_formatted' => $this->formatBytes($session->acctoutputoctets),
                'total_formatted' => $this->formatBytes($session->acctinputoctets + $session->acctoutputoctets),
                'client' => $session->client,
            ];
        });

        return response()->json([
            'online_count' => $this->radiusService->getOnlineUsersCount(),
            'sessions' => $sessions,
        ]);
    }

    /**
     * Get session history
     */
    public function sessionHistory(Request $request)
    {
        $query = RadiusAccounting::whereNotNull('acctstoptime')
            ->orderBy('acctstarttime', 'desc');

        // Search by username
        if ($request->has('username')) {
            $query->where('username', $request->username);
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $query->where('acctstarttime', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('acctstarttime', '<=', $request->end_date);
        }

        // Filter by NAS
        if ($request->has('nasipaddress')) {
            $query->where('nasipaddress', $request->nasipaddress);
        }

        $sessions = $query->paginate(20);

        // Format data
        $sessions->getCollection()->transform(function ($session) {
            $duration = $session->acctstoptime 
                ? $session->acctstoptime->diffInSeconds($session->acctstarttime)
                : 0;

            return [
                'username' => $session->username,
                'nas_ip' => $session->nasipaddress,
                'framed_ip' => $session->framedipaddress,
                'session_id' => $session->acctsessionid,
                'start_time' => $session->acctstarttime,
                'stop_time' => $session->acctstoptime,
                'duration_seconds' => $duration,
                'duration_formatted' => $this->formatDuration($duration),
                'download_bytes' => $session->acctinputoctets,
                'upload_bytes' => $session->acctoutputoctets,
                'download_formatted' => $this->formatBytes($session->acctinputoctets),
                'upload_formatted' => $this->formatBytes($session->acctoutputoctets),
                'total_formatted' => $this->formatBytes($session->acctinputoctets + $session->acctoutputoctets),
                'terminate_cause' => $session->acctterminatecause,
            ];
        });

        return response()->json($sessions);
    }

    /**
     * Get bandwidth usage statistics
     */
    public function bandwidthStats(Request $request)
    {
        $period = $request->input('period', 'today'); // today, week, month

        switch ($period) {
            case 'week':
                $startDate = now()->startOfWeek();
                break;
            case 'month':
                $startDate = now()->startOfMonth();
                break;
            default:
                $startDate = now()->startOfDay();
        }

        $stats = DB::table('radacct')
            ->where('acctstarttime', '>=', $startDate)
            ->selectRaw('
                COUNT(DISTINCT username) as unique_users,
                COUNT(*) as total_sessions,
                SUM(acctinputoctets) as total_download,
                SUM(acctoutputoctets) as total_upload,
                AVG(acctsessiontime) as avg_session_duration
            ')
            ->first();

        // Get top users by bandwidth
        $topUsers = DB::table('radacct')
            ->where('acctstarttime', '>=', $startDate)
            ->select('username')
            ->selectRaw('SUM(acctinputoctets + acctoutputoctets) as total_bandwidth')
            ->groupBy('username')
            ->orderByDesc('total_bandwidth')
            ->limit(10)
            ->get()
            ->map(function ($user) {
                return [
                    'username' => $user->username,
                    'total_bandwidth' => $user->total_bandwidth,
                    'formatted' => $this->formatBytes($user->total_bandwidth),
                ];
            });

        return response()->json([
            'period' => $period,
            'start_date' => $startDate,
            'statistics' => [
                'unique_users' => $stats->unique_users ?? 0,
                'total_sessions' => $stats->total_sessions ?? 0,
                'total_download' => $stats->total_download ?? 0,
                'total_upload' => $stats->total_upload ?? 0,
                'total_bandwidth' => ($stats->total_download ?? 0) + ($stats->total_upload ?? 0),
                'download_formatted' => $this->formatBytes($stats->total_download ?? 0),
                'upload_formatted' => $this->formatBytes($stats->total_upload ?? 0),
                'total_formatted' => $this->formatBytes(($stats->total_download ?? 0) + ($stats->total_upload ?? 0)),
                'avg_session_duration' => $stats->avg_session_duration ?? 0,
                'avg_duration_formatted' => $this->formatDuration($stats->avg_session_duration ?? 0),
            ],
            'top_users' => $topUsers,
        ]);
    }

    /**
     * Get user session details
     */
    public function userSessions(Request $request, $username)
    {
        $sessions = $this->radiusService->getUserSessions($username, 20);

        $formatted = $sessions->map(function ($session) {
            $duration = $session->acctstoptime 
                ? strtotime($session->acctstoptime) - strtotime($session->acctstarttime)
                : now()->diffInSeconds($session->acctstarttime);

            return [
                'session_id' => $session->acctsessionid,
                'nas_ip' => $session->nasipaddress,
                'framed_ip' => $session->framedipaddress,
                'start_time' => $session->acctstarttime,
                'stop_time' => $session->acctstoptime,
                'duration_seconds' => $duration,
                'duration_formatted' => $this->formatDuration($duration),
                'download_bytes' => $session->acctinputoctets,
                'upload_bytes' => $session->acctoutputoctets,
                'download_formatted' => $this->formatBytes($session->acctinputoctets),
                'upload_formatted' => $this->formatBytes($session->acctoutputoctets),
                'total_formatted' => $this->formatBytes($session->acctinputoctets + $session->acctoutputoctets),
                'terminate_cause' => $session->acctterminatecause,
                'is_active' => is_null($session->acctstoptime),
            ];
        });

        return response()->json([
            'username' => $username,
            'sessions' => $formatted,
        ]);
    }

    /**
     * Disconnect user session
     */
    public function disconnectUser(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Find active session
        $session = RadiusAccounting::where('username', $request->username)
            ->whereNull('acctstoptime')
            ->first();

        if (!$session) {
            return response()->json([
                'message' => 'No active session found for this user',
            ], 404);
        }

        // Note: Actual disconnection requires Mikrotik API integration
        // For now, we'll just return the session info
        return response()->json([
            'message' => 'To disconnect this user, use Mikrotik API or manually disconnect from router',
            'session' => [
                'username' => $session->username,
                'nas_ip' => $session->nasipaddress,
                'session_id' => $session->acctsessionid,
                'framed_ip' => $session->framedipaddress,
            ],
            'note' => 'Mikrotik API integration required for automatic disconnection',
        ]);
    }

    /**
     * Get real-time statistics
     */
    public function realtimeStats()
    {
        $onlineCount = $this->radiusService->getOnlineUsersCount();
        $todayBandwidth = $this->radiusService->getTodayBandwidth();

        // Get total clients and vouchers
        $totalClients = Client::count();
        $activeClients = Client::where('status', 'active')->count();
        $totalVouchers = Voucher::count();
        $availableVouchers = Voucher::where('status', 'available')->count();

        return response()->json([
            'online_users' => $onlineCount,
            'total_clients' => $totalClients,
            'active_clients' => $activeClients,
            'total_vouchers' => $totalVouchers,
            'available_vouchers' => $availableVouchers,
            'today_bandwidth' => [
                'download' => $todayBandwidth['download'],
                'upload' => $todayBandwidth['upload'],
                'total' => $todayBandwidth['total'],
                'download_formatted' => $this->formatBytes($todayBandwidth['download']),
                'upload_formatted' => $this->formatBytes($todayBandwidth['upload']),
                'total_formatted' => $this->formatBytes($todayBandwidth['total']),
            ],
        ]);
    }

    /**
     * Format bytes to human readable format
     */
    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }

    /**
     * Format duration to human readable format
     */
    private function formatDuration($seconds)
    {
        $hours = floor($seconds / 3600);
        $minutes = floor(($seconds % 3600) / 60);
        $secs = $seconds % 60;

        return sprintf('%02d:%02d:%02d', $hours, $minutes, $secs);
    }
}
