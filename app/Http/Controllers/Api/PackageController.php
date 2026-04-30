<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Package;
use Illuminate\Http\Request;

class PackageController extends Controller
{
    public function index(Request $request)
    {
        $query = Package::query();

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        $packages = $query->orderBy('price')->get();

        return response()->json([
            'success' => true,
            'data' => $packages,
        ]);
    }

    public function store(Request $request)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'type' => 'required|in:pppoe,hotspot',
            'speed_download' => 'required|integer|min:1',
            'speed_upload' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ];

        // Hotspot-specific fields
        if ($request->type === 'hotspot') {
            $rules['uptime_limit'] = 'nullable|integer|min:1';     // minutes
            $rules['expire_after'] = 'nullable|integer|min:1';     // days
            $rules['quota'] = 'nullable|integer|min:1';            // GB
            $rules['reseller_commission'] = 'nullable|numeric|min:0'; // Rp nominal
        }

        $validated = $request->validate($rules);

        // Null out hotspot fields for pppoe
        if ($request->type === 'pppoe') {
            $validated['uptime_limit'] = null;
            $validated['expire_after'] = null;
            $validated['quota'] = null;
            $validated['reseller_commission'] = 0;
        }

        $package = Package::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Paket berhasil ditambahkan',
            'data' => $package,
        ], 201);
    }

    public function show(Package $package)
    {
        return response()->json([
            'success' => true,
            'data' => $package,
        ]);
    }

    public function update(Request $request, Package $package)
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'type' => 'in:pppoe,hotspot',
            'speed_download' => 'integer|min:1',
            'speed_upload' => 'integer|min:1',
            'quota' => 'nullable|integer|min:1',
            'uptime_limit' => 'nullable|integer|min:1',
            'expire_after' => 'nullable|integer|min:1',
            'price' => 'numeric|min:0',
            'reseller_commission' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $package->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Package updated successfully',
            'data' => $package,
        ]);
    }

    public function destroy(Package $package)
    {
        if ($package->clients()->count() > 0 || $package->vouchers()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete package that is being used',
            ], 422);
        }

        $package->delete();

        return response()->json([
            'success' => true,
            'message' => 'Package deleted successfully',
        ]);
    }
}
