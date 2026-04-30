<?php

namespace App\Http\Controllers;

use App\Models\Reseller;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ResellerController extends Controller
{
    /**
     * Display a listing of resellers
     */
    public function index(Request $request)
    {
        $query = Reseller::with('user');

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $resellers = $query->paginate(15);

        return response()->json($resellers);
    }

    /**
     * Store a newly created reseller
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'commission_rate' => 'required|numeric|min:0|max:100',
            'balance' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:active,suspended',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Create user account
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'phone' => $request->phone,
                'role' => 'reseller',
            ]);

            // Assign reseller role
            $user->assignRole('reseller');

            // Create reseller profile
            $reseller = Reseller::create([
                'user_id' => $user->id,
                'commission_rate' => $request->commission_rate,
                'balance' => $request->balance ?? 0,
                'status' => $request->status ?? 'active',
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Reseller created successfully',
                'reseller' => $reseller->load('user'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create reseller',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified reseller
     */
    public function show($id)
    {
        $reseller = Reseller::with(['user', 'vouchers' => function ($query) {
            $query->latest()->limit(10);
        }])->findOrFail($id);

        // Get statistics
        $stats = [
            'total_vouchers' => $reseller->vouchers()->count(),
            'available_vouchers' => $reseller->vouchers()->where('status', 'available')->count(),
            'used_vouchers' => $reseller->vouchers()->where('status', 'used')->count(),
            'expired_vouchers' => $reseller->vouchers()->where('status', 'expired')->count(),
        ];

        return response()->json([
            'reseller' => $reseller,
            'statistics' => $stats,
        ]);
    }

    /**
     * Update the specified reseller
     */
    public function update(Request $request, $id)
    {
        $reseller = Reseller::with('user')->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $reseller->user_id,
            'password' => 'nullable|string|min:8',
            'phone' => 'nullable|string|max:20',
            'commission_rate' => 'sometimes|required|numeric|min:0|max:100',
            'balance' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:active,suspended',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Update user account
            $userData = $request->only(['name', 'email', 'phone']);
            if ($request->filled('password')) {
                $userData['password'] = Hash::make($request->password);
            }
            $reseller->user->update($userData);

            // Update reseller profile
            $reseller->update($request->only(['commission_rate', 'balance', 'status']));

            DB::commit();

            return response()->json([
                'message' => 'Reseller updated successfully',
                'reseller' => $reseller->load('user'),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update reseller',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified reseller
     */
    public function destroy($id)
    {
        $reseller = Reseller::with('user')->findOrFail($id);

        // Check if reseller has active vouchers
        $activeVouchersCount = $reseller->vouchers()->where('status', 'available')->count();
        
        if ($activeVouchersCount > 0) {
            return response()->json([
                'message' => "Cannot delete reseller. They have {$activeVouchersCount} active voucher(s).",
            ], 422);
        }

        DB::beginTransaction();
        try {
            $user = $reseller->user;
            $reseller->delete();
            $user->delete();

            DB::commit();

            return response()->json([
                'message' => 'Reseller deleted successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete reseller',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get reseller sales report
     */
    public function salesReport($id, Request $request)
    {
        $reseller = Reseller::findOrFail($id);

        $startDate = $request->input('start_date', now()->startOfMonth());
        $endDate = $request->input('end_date', now()->endOfMonth());

        $vouchers = Voucher::where('reseller_id', $id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->with('package')
            ->get();

        $report = [
            'period' => [
                'start' => $startDate,
                'end' => $endDate,
            ],
            'total_vouchers_generated' => $vouchers->count(),
            'vouchers_used' => $vouchers->where('status', 'used')->count(),
            'vouchers_available' => $vouchers->where('status', 'available')->count(),
            'vouchers_expired' => $vouchers->where('status', 'expired')->count(),
            'total_revenue' => $vouchers->where('status', 'used')->sum(function ($voucher) {
                return $voucher->package->price ?? 0;
            }),
            'commission_earned' => $vouchers->where('status', 'used')->sum(function ($voucher) use ($reseller) {
                $price = $voucher->package->price ?? 0;
                return $price * ($reseller->commission_rate / 100);
            }),
        ];

        return response()->json([
            'reseller' => $reseller->load('user'),
            'report' => $report,
        ]);
    }

    /**
     * Add balance to reseller
     */
    public function addBalance(Request $request, $id)
    {
        $reseller = Reseller::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0',
            'note' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $reseller->increment('balance', $request->amount);

        return response()->json([
            'message' => 'Balance added successfully',
            'reseller' => $reseller,
            'new_balance' => $reseller->balance,
        ]);
    }

    /**
     * Deduct balance from reseller
     */
    public function deductBalance(Request $request, $id)
    {
        $reseller = Reseller::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0',
            'note' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        if ($reseller->balance < $request->amount) {
            return response()->json([
                'message' => 'Insufficient balance',
            ], 422);
        }

        $reseller->decrement('balance', $request->amount);

        return response()->json([
            'message' => 'Balance deducted successfully',
            'reseller' => $reseller,
            'new_balance' => $reseller->balance,
        ]);
    }
}
