<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\User;
use App\Services\FreeRadiusService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ClientController extends Controller
{
    protected $radiusService;

    public function __construct(FreeRadiusService $radiusService)
    {
        $this->radiusService = $radiusService;
    }
    public function index(Request $request)
    {
        $query = Client::with(['user', 'package']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('username', 'like', "%{$search}%")
                  ->orWhere('client_id', 'like', "%{$search}%")
                  ->orWhereHas('user', function($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $clients = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json(['success' => true, 'data' => $clients]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'username' => 'required|string|max:64|unique:clients,username',
            'password' => 'required|string|min:8',
            'package_id' => 'required|exists:packages,id',
            'ip_address' => 'nullable|ip',
            'installation_address' => 'required|string',
            'phone' => 'required|string|max:20',
            'billing_date' => 'required|integer|min:1|max:31',
        ]);

        DB::beginTransaction();
        try {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'client',
                'status' => 'active',
            ]);

            $client = Client::create([
                'user_id' => $user->id,
                'username' => $validated['username'],
                'pppoe_password' => $validated['password'], // store cleartext for display
                'package_id' => $validated['package_id'],
                'ip_address' => $validated['ip_address'] ?? null,
                'installation_address' => $validated['installation_address'],
                'phone' => $validated['phone'],
                'billing_date' => $validated['billing_date'],
                'status' => 'active',
            ]);

            // Create FreeRADIUS user
            $this->radiusService->createUser(
                $validated['username'],
                $validated['password'],
                $client->package->rate_limit // accessor: "{upload}M/{download}M"
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Client created successfully',
                'data' => $client->load(['user', 'package']),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create client: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show(Client $client)
    {
        return response()->json(['success' => true, 'data' => $client->load(['user', 'package'])]);
    }

    public function update(Request $request, Client $client)
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'email' => 'email|unique:users,email,' . $client->user_id,
            'package_id' => 'exists:packages,id',
            'ip_address' => 'nullable|ip',
            'installation_address' => 'string',
            'phone' => 'string|max:20',
            'billing_date' => 'integer|min:1|max:31',
        ]);

        DB::beginTransaction();
        try {
            if (isset($validated['name']) || isset($validated['email'])) {
                $client->user->update([
                    'name' => $validated['name'] ?? $client->user->name,
                    'email' => $validated['email'] ?? $client->user->email,
                ]);
            }

            $client->update($validated);

            if (isset($validated['package_id'])) {
                // Update FreeRADIUS rate limit
                $this->radiusService->updateRateLimit(
                    $client->username,
                    $client->package->rate_limit
                );
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Client updated successfully',
                'data' => $client->load(['user', 'package']),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Failed to update client: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(Client $client)
    {
        DB::beginTransaction();
        try {
            // Delete from FreeRADIUS
            $this->radiusService->deleteUser($client->username);
            
            $user = $client->user;
            $client->delete();
            $user->delete();
            DB::commit();

            return response()->json(['success' => true, 'message' => 'Client deleted successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Failed to delete client: ' . $e->getMessage()], 500);
        }
    }

    public function suspend(Client $client)
    {
        // Suspend in FreeRADIUS
        $this->radiusService->suspendUser($client->username);
        
        $client->suspend();
        return response()->json(['success' => true, 'message' => 'Client suspended successfully']);
    }

    public function activate(Client $client)
    {
        // Activate in FreeRADIUS (restore password)
        $this->radiusService->activateUser($client->username, $client->user->password);
        
        $client->activate();
        return response()->json(['success' => true, 'message' => 'Client activated successfully']);
    }

    /**
     * Get authenticated client's own profile
     */
    public function myProfile(Request $request)
    {
        $user = $request->user();
        $client = $user->client;

        if (!$client) {
            return response()->json(['success' => false, 'message' => 'Client profile not found'], 404);
        }

        $client->load('package');

        // Get usage stats from radacct
        $usage = DB::table('radacct')
            ->where('username', $client->username)
            ->selectRaw('
                SUM(acctinputoctets) as total_download,
                SUM(acctoutputoctets) as total_upload,
                SUM(acctsessiontime) as total_time,
                COUNT(*) as total_sessions
            ')
            ->first();

        // Check if currently online
        $isOnline = DB::table('radacct')
            ->where('username', $client->username)
            ->whereNull('acctstoptime')
            ->exists();

        return response()->json([
            'success' => true,
            'data' => [
                'client' => $client,
                'user' => $user->only(['id', 'name', 'email']),
                'is_online' => $isOnline,
                'usage' => [
                    'total_download' => $usage->total_download ?? 0,
                    'total_upload' => $usage->total_upload ?? 0,
                    'total_time' => $usage->total_time ?? 0,
                    'total_sessions' => $usage->total_sessions ?? 0,
                ],
            ],
        ]);
    }

    /**
     * Get authenticated client's invoices/billing info
     */
    public function myInvoices(Request $request)
    {
        $user = $request->user();
        $client = $user->client;

        if (!$client) {
            return response()->json(['success' => false, 'message' => 'Client profile not found'], 404);
        }

        $client->load('package');

        // Build billing info
        $package = $client->package;
        $billingDate = $client->billing_date;
        
        // Calculate next billing date
        $now = now();
        $nextBilling = $now->copy()->day($billingDate);
        if ($nextBilling->isPast()) {
            $nextBilling->addMonth();
        }

        // Get transaction history
        $transactions = \App\Models\Transaction::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(12)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'client_id' => $client->client_id,
                'client_name' => $user->name,
                'package' => [
                    'name' => $package->name,
                    'speed' => "{$package->speed_download}M/{$package->speed_upload}M",
                    'price' => $package->price,
                ],
                'billing_date' => $billingDate,
                'next_billing' => $nextBilling->format('Y-m-d'),
                'status' => $client->status,
                'transactions' => $transactions,
            ],
        ]);
    }
}
