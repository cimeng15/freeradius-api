<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Package;
use App\Models\Reseller;
use App\Models\Router;
use App\Models\Voucher;
use App\Models\Transaction;
use App\Services\FreeRadiusService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    protected $radiusService;

    public function __construct(FreeRadiusService $radiusService)
    {
        $this->radiusService = $radiusService;
    }

    /**
     * Get dashboard statistics based on user role
     */
    public function index()
    {
        $user = Auth::user();

        switch ($user->role) {
            case 'superadmin':
            case 'noc':
                return $this->adminDashboard();
            case 'reseller':
                return $this->resellerDashboard();
            case 'client':
                return $this->clientDashboard();
            default:
                return response()->json(['message' => 'Invalid role'], 403);
        }
    }

    /**
     * Admin/NOC Dashboard
     */
    private function adminDashboard()
    {
        // Overview statistics
        $stats = [
            'total_clients' => Client::count(),
            'active_clients' => Client::where('status', 'active')->count(),
            'suspended_clients' => Client::where('status', 'suspended')->count(),
            'terminated_clients' => Client::where('status', 'terminated')->count(),
            'total_packages' => Package::count(),
            'active_packages' => Package::where('is_active', true)->count(),
            'total_routers' => Router::count(),
            'active_routers' => Router::where('status', 'active')->count(),
            'total_resellers' => Reseller::count(),
            'active_resellers' => Reseller::where('status', 'active')->count(),
            'total_vouchers' => Voucher::count(),
            'available_vouchers' => Voucher::where('status', 'available')->count(),
            'used_vouchers' => Voucher::where('status', 'used')->count(),
            'online_users' => $this->radiusService->getOnlineUsersCount(),
        ];

        // Revenue statistics (this month)
        $thisMonth = now()->startOfMonth();
        $revenue = [
            'this_month' => Transaction::where('created_at', '>=', $thisMonth)
                ->where('status', 'completed')
                ->sum('amount'),
            'pending' => Transaction::where('status', 'pending')->sum('amount'),
            'total' => Transaction::where('status', 'completed')->sum('amount'),
        ];

        // Bandwidth statistics (today)
        $bandwidth = $this->radiusService->getTodayBandwidth();

        // Recent clients
        $recentClients = Client::with(['package'])
            ->latest()
            ->limit(5)
            ->get();

        // Package distribution
        $packageStats = Package::withCount('clients')
            ->where('is_active', true)
            ->get()
            ->map(function ($package) {
                return [
                    'name' => $package->name,
                    'type' => $package->type,
                    'clients_count' => $package->clients_count,
                ];
            });

        // Monthly revenue chart (last 6 months)
        $monthlyRevenue = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $monthlyRevenue[] = [
                'month' => $month->format('M Y'),
                'revenue' => Transaction::whereYear('created_at', $month->year)
                    ->whereMonth('created_at', $month->month)
                    ->where('status', 'completed')
                    ->sum('amount'),
            ];
        }

        return response()->json([
            'statistics' => $stats,
            'revenue' => $revenue,
            'bandwidth' => [
                'download' => $bandwidth['download'],
                'upload' => $bandwidth['upload'],
                'total' => $bandwidth['total'],
                'download_formatted' => $this->formatBytes($bandwidth['download']),
                'upload_formatted' => $this->formatBytes($bandwidth['upload']),
                'total_formatted' => $this->formatBytes($bandwidth['total']),
            ],
            'recent_clients' => $recentClients,
            'package_distribution' => $packageStats,
            'monthly_revenue' => $monthlyRevenue,
        ]);
    }

    /**
     * Reseller Dashboard
     */
    private function resellerDashboard()
    {
        $reseller = Reseller::where('user_id', Auth::id())->first();

        if (!$reseller) {
            return response()->json(['message' => 'Reseller profile not found'], 404);
        }

        // Voucher statistics
        $stats = [
            'total_vouchers' => $reseller->vouchers()->count(),
            'available_vouchers' => $reseller->vouchers()->where('status', 'available')->count(),
            'used_vouchers' => $reseller->vouchers()->where('status', 'used')->count(),
            'expired_vouchers' => $reseller->vouchers()->where('status', 'expired')->count(),
            'balance' => $reseller->balance,
            'commission_rate' => $reseller->commission_rate,
        ];

        // Sales this month
        $thisMonth = now()->startOfMonth();
        $salesThisMonth = $reseller->vouchers()
            ->where('status', 'used')
            ->where('used_at', '>=', $thisMonth)
            ->with('package')
            ->get();

        $monthlyStats = [
            'vouchers_sold' => $salesThisMonth->count(),
            'revenue' => $salesThisMonth->sum(function ($voucher) {
                return $voucher->package->price ?? 0;
            }),
            'commission_earned' => $salesThisMonth->sum(function ($voucher) use ($reseller) {
                $price = $voucher->package->price ?? 0;
                return $price * ($reseller->commission_rate / 100);
            }),
        ];

        // Recent vouchers
        $recentVouchers = $reseller->vouchers()
            ->with('package')
            ->latest()
            ->limit(10)
            ->get();

        // Sales chart (last 30 days)
        $dailySales = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $dailySales[] = [
                'date' => $date->format('M d'),
                'count' => $reseller->vouchers()
                    ->where('status', 'used')
                    ->whereDate('used_at', $date)
                    ->count(),
            ];
        }

        return response()->json([
            'reseller' => $reseller,
            'statistics' => $stats,
            'monthly_stats' => $monthlyStats,
            'recent_vouchers' => $recentVouchers,
            'daily_sales' => $dailySales,
        ]);
    }

    /**
     * Client Dashboard
     */
    private function clientDashboard()
    {
        $client = Client::where('user_id', Auth::id())
            ->with(['package'])
            ->first();

        if (!$client) {
            return response()->json(['message' => 'Client profile not found'], 404);
        }

        $package = $client->package;

        // Calculate total usage
        $totalUsage = DB::table('radacct')
            ->where('username', $client->username)
            ->selectRaw('
                SUM(acctinputoctets) as total_download,
                SUM(acctoutputoctets) as total_upload,
                SUM(acctsessiontime) as total_time
            ')
            ->first();

        // Check if currently online
        $isOnline = DB::table('radacct')
            ->where('username', $client->username)
            ->whereNull('acctstoptime')
            ->exists();

        // Calculate next billing date
        $now = now();
        $nextBilling = $now->copy()->day($client->billing_date);
        if ($nextBilling->isPast()) {
            $nextBilling->addMonth();
        }
        $daysUntilBilling = $now->diffInDays($nextBilling, false);

        $stats = [
            'client_id' => $client->client_id,
            'status' => $client->status,
            'is_online' => $isOnline,
            'total_download' => $totalUsage->total_download ?? 0,
            'total_upload' => $totalUsage->total_upload ?? 0,
            'download_formatted' => $this->formatBytes($totalUsage->total_download ?? 0),
            'upload_formatted' => $this->formatBytes($totalUsage->total_upload ?? 0),
            'total_formatted' => $this->formatBytes(($totalUsage->total_download ?? 0) + ($totalUsage->total_upload ?? 0)),
            'time_formatted' => $this->formatDuration($totalUsage->total_time ?? 0),
        ];

        $billing = [
            'package_name' => $package->name ?? '-',
            'package_speed' => $package ? "{$package->speed_download}M/{$package->speed_upload}M" : '-',
            'package_price' => $package->price ?? 0,
            'billing_date' => $client->billing_date,
            'next_billing' => $nextBilling->format('Y-m-d'),
            'days_until_billing' => max(0, $daysUntilBilling),
        ];

        // Recent transactions
        $transactions = Transaction::where('user_id', Auth::id())
            ->latest()
            ->limit(6)
            ->get();

        return response()->json([
            'client' => $client,
            'statistics' => $stats,
            'billing' => $billing,
            'recent_transactions' => $transactions,
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
