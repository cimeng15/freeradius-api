<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\PackageController;
use App\Http\Controllers\RouterController;
use App\Http\Controllers\VoucherController;
use App\Http\Controllers\ResellerController;
use App\Http\Controllers\MonitoringController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MikrotikConfigController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/login', [AuthController::class, 'login']);           // Staff login (email/username auto-detect)
Route::post('/client-login', [AuthController::class, 'clientLogin']); // Client login (ID Pelanggan)
Route::get('/public/settings', [SettingsController::class, 'public']); // Public branding (no auth)
Route::post('/reset-password', [AuthController::class, 'resetPassword']); // Reset password (admin command)

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // Dashboard (all roles)
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Superadmin only routes
    Route::middleware('role:superadmin')->group(function () {
        // Packages
        Route::apiResource('packages', PackageController::class);
        
        // Clients
        Route::apiResource('clients', ClientController::class);
        Route::post('clients/{client}/suspend', [ClientController::class, 'suspend']);
        Route::post('clients/{client}/activate', [ClientController::class, 'activate']);

        // Routers
        Route::apiResource('routers', RouterController::class);
        Route::post('routers/{router}/test', [RouterController::class, 'test']);
        Route::get('routers/{router}/statistics', [RouterController::class, 'statistics']);

        // Resellers
        Route::apiResource('resellers', ResellerController::class);
        Route::get('resellers/{reseller}/sales-report', [ResellerController::class, 'salesReport']);
        Route::post('resellers/{reseller}/add-balance', [ResellerController::class, 'addBalance']);
        Route::post('resellers/{reseller}/deduct-balance', [ResellerController::class, 'deductBalance']);

        // Vouchers (superadmin can manage all)
        Route::apiResource('vouchers', VoucherController::class);
        Route::post('vouchers/bulk', [VoucherController::class, 'bulk']);
        Route::post('vouchers/check', [VoucherController::class, 'check']);
        Route::post('vouchers/{voucher}/use', [VoucherController::class, 'use']);
        Route::post('vouchers/bulk-action', [VoucherController::class, 'bulkAction']);
        Route::get('vouchers-grouped', [VoucherController::class, 'groupedByTime']);

        // Staff Management
        Route::apiResource('staff', StaffController::class);
        Route::get('staff-roles', [StaffController::class, 'roles']);

        // Settings
        Route::get('settings', [SettingsController::class, 'index']);
        Route::get('settings/group/{group}', [SettingsController::class, 'group']);
        Route::post('settings', [SettingsController::class, 'update']);
        Route::post('settings/general', [SettingsController::class, 'updateGeneral']);
        Route::post('settings/logo', [SettingsController::class, 'uploadLogo']);
        Route::get('settings/system-info', [SettingsController::class, 'systemInfo']);

        // Tools
        Route::post('tools/ping', [SettingsController::class, 'ping']);
        Route::post('tools/traceroute', [SettingsController::class, 'traceroute']);

        // Mikrotik Config Generator
        Route::get('mikrotik-config', [MikrotikConfigController::class, 'generate']);
    });

    // NOC routes (monitoring and read-only access)
    Route::middleware('role:noc,superadmin')->group(function () {
        // Monitoring
        Route::get('monitoring/online-users', [MonitoringController::class, 'onlineUsers']);
        Route::get('monitoring/session-history', [MonitoringController::class, 'sessionHistory']);
        Route::get('monitoring/bandwidth-stats', [MonitoringController::class, 'bandwidthStats']);
        Route::get('monitoring/user-sessions/{username}', [MonitoringController::class, 'userSessions']);
        Route::post('monitoring/disconnect-user', [MonitoringController::class, 'disconnectUser']);
        Route::get('monitoring/realtime-stats', [MonitoringController::class, 'realtimeStats']);

        // Read-only access to resources
        Route::get('packages', [PackageController::class, 'index']);
        Route::get('packages/{package}', [PackageController::class, 'show']);
        Route::get('clients', [ClientController::class, 'index']);
        Route::get('clients/{client}', [ClientController::class, 'show']);
        Route::get('routers', [RouterController::class, 'index']);
        Route::get('routers/{router}', [RouterController::class, 'show']);
    });

    // Reseller routes
    Route::middleware('role:reseller,superadmin')->group(function () {
        // Packages (read-only, untuk pilih paket saat generate voucher)
        Route::get('packages', [PackageController::class, 'index']);

        // Vouchers (reseller can only manage their own)
        Route::get('vouchers', [VoucherController::class, 'index']);
        Route::post('vouchers', [VoucherController::class, 'store']);
        Route::get('vouchers/{voucher}', [VoucherController::class, 'show']);
        Route::put('vouchers/{voucher}', [VoucherController::class, 'update']);
        Route::delete('vouchers/{voucher}', [VoucherController::class, 'destroy']);
        Route::post('vouchers/bulk', [VoucherController::class, 'bulk']);
        Route::post('vouchers/check', [VoucherController::class, 'check']);
        Route::post('vouchers/bulk-action', [VoucherController::class, 'bulkAction']);
        Route::get('vouchers-grouped', [VoucherController::class, 'groupedByTime']);
    });

    // Client routes (view own data only)
    Route::middleware('role:client')->group(function () {
        Route::get('my-profile', [ClientController::class, 'myProfile']);
        Route::get('my-sessions', [MonitoringController::class, 'userSessions']);
        Route::get('my-invoices', [ClientController::class, 'myInvoices']);
    });
});
