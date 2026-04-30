<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class StaffController extends Controller
{
    /**
     * List all staff users (non-client)
     */
    public function index(Request $request)
    {
        $query = User::where('role', '!=', 'client');

        // Filter by role
        if ($request->has('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $staff = $query->orderBy('role')->orderBy('name')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $staff,
        ]);
    }

    /**
     * Create new staff user
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'username' => 'nullable|string|max:50|unique:users,username',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|in:superadmin,noc,reseller',
            'status' => 'nullable|in:active,suspended,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'username' => $request->username ?: null,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'status' => $request->status ?? 'active',
        ]);

        // Assign Spatie role
        $user->assignRole($request->role);

        // If reseller, create reseller profile
        if ($request->role === 'reseller') {
            \App\Models\Reseller::create([
                'user_id' => $user->id,
                'balance' => $request->input('balance', 0),
                'status' => 'active',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Staff berhasil ditambahkan',
            'data' => $user,
        ], 201);
    }

    /**
     * Show staff user detail
     */
    public function show($id)
    {
        $user = User::where('role', '!=', 'client')->findOrFail($id);
        
        if ($user->role === 'reseller') {
            $user->load('reseller');
        }

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    /**
     * Update staff user
     */
    public function update(Request $request, $id)
    {
        $user = User::where('role', '!=', 'client')->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'username' => 'nullable|string|max:50|unique:users,username,' . $id,
            'email' => 'sometimes|required|email|unique:users,email,' . $id,
            'password' => 'nullable|string|min:8',
            'role' => 'sometimes|required|in:superadmin,noc,reseller',
            'status' => 'nullable|in:active,suspended,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $request->only(['name', 'username', 'email', 'status']);
        
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        // Handle role change
        if ($request->has('role') && $request->role !== $user->role) {
            $oldRole = $user->role;
            $data['role'] = $request->role;

            // Remove old Spatie role, assign new
            $user->syncRoles([$request->role]);

            // If changing TO reseller, create profile
            if ($request->role === 'reseller' && !$user->reseller) {
                \App\Models\Reseller::create([
                    'user_id' => $user->id,
                    'balance' => 0,
                    'status' => 'active',
                ]);
            }
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Staff berhasil diupdate',
            'data' => $user->fresh(),
        ]);
    }

    /**
     * Delete staff user
     */
    public function destroy($id)
    {
        $user = User::where('role', '!=', 'client')->findOrFail($id);

        // Prevent deleting yourself
        if ($user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak bisa menghapus akun sendiri',
            ], 422);
        }

        // Prevent deleting last superadmin
        if ($user->role === 'superadmin') {
            $adminCount = User::where('role', 'superadmin')->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak bisa menghapus superadmin terakhir',
                ], 422);
            }
        }

        DB::beginTransaction();
        try {
            // Delete reseller profile if exists
            if ($user->reseller) {
                $user->reseller->delete();
            }
            $user->delete();
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Staff berhasil dihapus',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus staff: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get available roles
     */
    public function roles()
    {
        return response()->json([
            'success' => true,
            'data' => [
                ['value' => 'superadmin', 'label' => 'Super Admin', 'description' => 'Akses penuh ke semua fitur'],
                ['value' => 'noc', 'label' => 'NOC', 'description' => 'Monitoring & troubleshooting jaringan'],
                ['value' => 'reseller', 'label' => 'Reseller', 'description' => 'Kelola & jual voucher'],
            ],
        ]);
    }
}
