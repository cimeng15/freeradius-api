<?php

namespace App\Http\Controllers;

use App\Models\Voucher;
use App\Models\Package;
use App\Models\Reseller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class VoucherController extends Controller
{
    /**
     * Generate voucher code with optional prefix
     */
    private function generateCode(string $prefix = '', int $length = 8): string
    {
        $chars = 'abcdefghjkmnpqrstuvwxyz23456789';
        do {
            $random = '';
            for ($i = 0; $i < $length; $i++) {
                $random .= $chars[random_int(0, strlen($chars) - 1)];
            }
            $code = $prefix ? strtolower($prefix) . '-' . $random : $random;
        } while (Voucher::where('code', $code)->exists());

        return $code;
    }

    private function getResellerId(): ?int
    {
        if (Auth::user()->role === 'reseller') {
            return Reseller::where('user_id', Auth::id())->first()?->id;
        }
        return null;
    }

    /**
     * Get voucher counts grouped by creation time
     */
    public function groupedByTime(Request $request)
    {
        $query = Voucher::query();

        // Reseller hanya lihat milik sendiri
        if (Auth::user()->role === 'reseller') {
            $resellerId = $this->getResellerId();
            if (!$resellerId) {
                return response()->json(['data' => []]);
            }
            $query->where('reseller_id', $resellerId);
        }

        // Filter by date if provided
        $dateFilter = $request->input('date_filter', 'today');
        switch ($dateFilter) {
            case 'today':
                $query->whereDate('created_at', today());
                break;
            case 'yesterday':
                $query->whereDate('created_at', today()->subDay());
                break;
            case '3days':
                $query->whereDate('created_at', '>=', today()->subDays(2));
                break;
            case '7days':
                $query->whereDate('created_at', '>=', today()->subDays(6));
                break;
            case '14days':
                $query->whereDate('created_at', '>=', today()->subDays(13));
                break;
            case '30days':
                $query->whereDate('created_at', '>=', today()->subDays(29));
                break;
            case 'thismonth':
                $query->whereMonth('created_at', today()->month)
                      ->whereYear('created_at', today()->year);
                break;
            case 'lastmonth':
                $query->whereMonth('created_at', today()->subMonth()->month)
                      ->whereYear('created_at', today()->subMonth()->year);
                break;
            case '90days':
                $query->whereDate('created_at', '>=', today()->subDays(89));
                break;
        }

        // Group by date and hour:minute
        $grouped = $query->selectRaw('DATE_FORMAT(created_at, "%Y-%m-%d %H:%i") as time_group, COUNT(*) as count')
            ->groupBy('time_group')
            ->orderBy('time_group', 'desc')
            ->get();

        return response()->json(['data' => $grouped]);
    }

    /**
     * List vouchers
     * Admin: semua | Reseller: hanya milik sendiri
     */
    public function index(Request $request)
    {
        $query = Voucher::with(['package', 'reseller.user']);

        // Reseller hanya lihat milik sendiri
        if (Auth::user()->role === 'reseller') {
            $resellerId = $this->getResellerId();
            $query->where('reseller_id', $resellerId);
        }

        if ($request->filled('search')) {
            $query->where('code', 'like', "%{$request->search}%");
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('package_id')) {
            $query->where('package_id', $request->package_id);
        }

        // Filter by specific time group (e.g., "2026-04-30 08:51")
        if ($request->filled('time_group')) {
            $query->whereRaw('DATE_FORMAT(created_at, "%Y-%m-%d %H:%i") = ?', [$request->time_group]);
        }

        // Quick date filters
        if ($request->filled('date_filter')) {
            switch ($request->date_filter) {
                case 'today':
                    $query->whereDate('created_at', today());
                    break;
                case 'yesterday':
                    $query->whereDate('created_at', today()->subDay());
                    break;
                case '3days':
                    $query->where('created_at', '>=', now()->subDays(3));
                    break;
                case '7days':
                    $query->where('created_at', '>=', now()->subDays(7));
                    break;
                case '14days':
                    $query->where('created_at', '>=', now()->subDays(14));
                    break;
                case '30days':
                    $query->where('created_at', '>=', now()->subDays(30));
                    break;
                case 'thismonth':
                    $query->where('created_at', '>=', now()->startOfMonth());
                    break;
                case 'lastmonth':
                    $query->whereBetween('created_at', [now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth()]);
                    break;
                case '90days':
                    $query->where('created_at', '>=', now()->subDays(90));
                    break;
            }
        }

        if ($request->filled('batch_id')) {
            $query->where('batch_id', $request->batch_id);
        }

        // Admin filter by reseller
        if ($request->filled('reseller_id') && Auth::user()->role === 'superadmin') {
            $query->where('reseller_id', $request->reseller_id);
        }

        $vouchers = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($vouchers);
    }

    /**
     * Create single voucher (manual, bisa custom code)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'package_id' => 'required|exists:packages,id',
            'code' => 'nullable|string|max:30|unique:vouchers,code',
            'prefix' => 'nullable|string|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validasi gagal', 'errors' => $validator->errors()], 422);
        }

        $package = Package::findOrFail($request->package_id);
        if ($package->type !== 'hotspot') {
            return response()->json(['message' => 'Paket harus tipe hotspot'], 422);
        }

        $resellerId = Auth::user()->role === 'reseller' ? $this->getResellerId() : ($request->reseller_id ?? null);

        $code = $request->code ?: $this->generateCode($request->prefix ?? '');

        $voucher = Voucher::create([
            'code' => $code,
            'package_id' => $package->id,
            'reseller_id' => $resellerId,
            'status' => 'unused',
        ]);

        return response()->json([
            'message' => 'Voucher berhasil dibuat',
            'data' => $voucher->load('package'),
        ], 201);
    }

    public function show($id)
    {
        $voucher = Voucher::with(['package', 'reseller.user'])->findOrFail($id);

        if (Auth::user()->role === 'reseller' && $voucher->reseller_id !== $this->getResellerId()) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        return response()->json(['data' => $voucher]);
    }

    public function update(Request $request, $id)
    {
        $voucher = Voucher::findOrFail($id);

        if (Auth::user()->role === 'reseller' && $voucher->reseller_id !== $this->getResellerId()) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $voucher->update($request->only(['status']));
        return response()->json(['message' => 'Voucher diupdate', 'data' => $voucher]);
    }

    public function destroy($id)
    {
        $voucher = Voucher::findOrFail($id);

        if (Auth::user()->role === 'reseller' && $voucher->reseller_id !== $this->getResellerId()) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        if ($voucher->status === 'used') {
            return response()->json(['message' => 'Tidak bisa menghapus voucher yang sudah dipakai'], 422);
        }

        $voucher->delete();
        return response()->json(['message' => 'Voucher dihapus']);
    }

    /**
     * Generate bulk vouchers (with prefix)
     */
    public function bulk(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'package_id' => 'required|exists:packages,id',
            'quantity' => 'required|integer|min:1|max:500',
            'prefix' => 'nullable|string|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validasi gagal', 'errors' => $validator->errors()], 422);
        }

        $package = Package::findOrFail($request->package_id);
        if ($package->type !== 'hotspot') {
            return response()->json(['message' => 'Paket harus tipe hotspot'], 422);
        }

        $resellerId = Auth::user()->role === 'reseller' ? $this->getResellerId() : ($request->reseller_id ?? null);

        if (Auth::user()->role === 'reseller' && !$resellerId) {
            return response()->json(['message' => 'Profil reseller tidak ditemukan'], 404);
        }

        $prefix = $request->prefix ?? '';
        $codeLength = $request->input('code_length', 8);
        $batchId = (string) Str::uuid();
        $vouchers = [];

        for ($i = 0; $i < $request->quantity; $i++) {
            $vouchers[] = Voucher::create([
                'code' => $this->generateCode($prefix, $codeLength),
                'package_id' => $package->id,
                'reseller_id' => $resellerId,
                'batch_id' => $batchId,
                'status' => 'unused',
            ]);
        }

        return response()->json([
            'message' => "{$request->quantity} voucher berhasil digenerate",
            'count' => count($vouchers),
            'batch_id' => $batchId,
            'data' => $vouchers,
        ], 201);
    }

    /**
     * Check voucher validity
     */
    public function check(Request $request)
    {
        $request->validate(['code' => 'required|string']);

        $voucher = Voucher::with('package')->where('code', $request->code)->first();

        if (!$voucher) {
            return response()->json(['valid' => false, 'message' => 'Voucher tidak ditemukan'], 404);
        }

        return response()->json([
            'valid' => $voucher->status === 'unused',
            'voucher' => $voucher,
            'message' => $voucher->status === 'unused' ? 'Voucher valid' : 'Voucher tidak valid (status: ' . $voucher->status . ')',
        ]);
    }

    /**
     * Use voucher
     */
    public function use(Request $request, $id)
    {
        $voucher = Voucher::with('package')->findOrFail($id);

        if ($voucher->status !== 'unused') {
            return response()->json(['message' => 'Voucher tidak tersedia'], 422);
        }

        $voucher->update([
            'status' => 'used',
            'used_by' => $request->input('username'),
            'used_at' => now(),
        ]);

        return response()->json(['message' => 'Voucher digunakan', 'data' => $voucher]);
    }
}
