<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Staff Login - auto-detect email or username
     * POST /api/login
     * { "identity": "admin@example.com" OR "admin", "password": "..." }
     */
    public function login(Request $request)
    {
        $request->validate([
            'identity' => 'required|string',
            'password' => 'required',
        ]);

        $identity = $request->input('identity');

        // Auto-detect: if contains @, treat as email; otherwise as username
        if (str_contains($identity, '@')) {
            $user = User::where('email', $identity)->first();
        } else {
            $user = User::where('username', $identity)->first();
        }

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'identity' => ['Username/email atau password salah.'],
            ]);
        }

        // Staff login should not allow client role
        if ($user->role === 'client') {
            throw ValidationException::withMessages([
                'identity' => ['Gunakan halaman login pelanggan untuk akun client.'],
            ]);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'identity' => ['Akun Anda tidak aktif. Hubungi administrator.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        if ($user->isReseller()) {
            $user->load('reseller');
        }

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ]);
    }

    /**
     * Client Login - tanpa password
     * POST /api/client-login
     * { "identifier": "1985000001" }  → bisa ID Pelanggan (10 digit) atau nomor HP
     */
    public function clientLogin(Request $request)
    {
        $request->validate([
            'identifier' => 'required|string|min:8|max:15',
        ]);

        $identifier = $request->input('identifier');

        // Cari: jika 10 digit dan awalan 1985 → ID Pelanggan, selain itu → nomor HP
        if (strlen($identifier) === 10 && str_starts_with($identifier, '1985')) {
            $client = \App\Models\Client::where('client_id', $identifier)->first();
        } else {
            // Cari berdasarkan nomor HP
            $client = \App\Models\Client::where('phone', $identifier)->first();
        }

        if (!$client) {
            throw ValidationException::withMessages([
                'identifier' => ['ID Pelanggan atau nomor HP tidak ditemukan.'],
            ]);
        }

        $user = $client->user;

        if (!$user) {
            throw ValidationException::withMessages([
                'identifier' => ['Akun tidak ditemukan. Hubungi administrator.'],
            ]);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'identifier' => ['Akun Anda tidak aktif. Hubungi administrator.'],
            ]);
        }

        if ($client->status === 'terminated') {
            throw ValidationException::withMessages([
                'identifier' => ['Layanan Anda telah dihentikan. Hubungi administrator.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;
        $user->load('client.package');

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ]);
    }

    /**
     * Logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout successful',
        ]);
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request)
    {
        $user = $request->user();
        
        // Load relationships based on role
        if ($user->isClient()) {
            $user->load('client.package');
        } elseif ($user->isReseller()) {
            $user->load('reseller');
        }

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    /**
     * Change password
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil diubah',
        ]);
    }

    /**
     * Reset password (public endpoint, requires master key)
     * Digunakan jika lupa password superadmin
     * POST /api/reset-password
     * { "identity": "admin", "new_password": "newpass123", "master_key": "..." }
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'identity' => 'required|string',
            'new_password' => 'required|min:8',
            'master_key' => 'required|string',
        ]);

        // Master key = APP_KEY (dari .env)
        $masterKey = config('app.key');
        if ($request->master_key !== $masterKey) {
            return response()->json([
                'success' => false,
                'message' => 'Master key salah.',
            ], 403);
        }

        $identity = $request->identity;
        if (str_contains($identity, '@')) {
            $user = User::where('email', $identity)->first();
        } else {
            $user = User::where('username', $identity)->first();
        }

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil direset untuk: ' . $user->name,
        ]);
    }
}
