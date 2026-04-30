<?php

namespace App\Http\Controllers;

use App\Models\Router;
use App\Services\FreeRadiusService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RouterController extends Controller
{
    protected $radiusService;

    public function __construct(FreeRadiusService $radiusService)
    {
        $this->radiusService = $radiusService;
    }

    /**
     * Display a listing of routers
     */
    public function index(Request $request)
    {
        $query = Router::query();

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $routers = $query->paginate(15);

        return response()->json($routers);
    }

    /**
     * Store a newly created router
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'ip_address' => 'required|ip|unique:routers,ip_address',
            'secret' => 'required|string|min:8',
            'type' => 'nullable|in:hotspot,pppoe,both',
            'location' => 'nullable|string|max:255',
            'status' => 'nullable|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Create router in database
        $router = Router::create($request->only(['name', 'ip_address', 'secret', 'type', 'location', 'status']));

        // Add to FreeRADIUS NAS table
        $nasAdded = $this->radiusService->addNas(
            $router->name,
            $router->ip_address,
            $router->secret
        );

        if (!$nasAdded) {
            return response()->json([
                'message' => 'Router created in panel but failed to sync with FreeRADIUS',
                'router' => $router,
                'radius_synced' => false,
            ], 201);
        }

        return response()->json([
            'message' => 'Router created successfully',
            'router' => $router,
            'radius_synced' => true,
        ], 201);
    }

    /**
     * Display the specified router
     */
    public function show($id)
    {
        $router = Router::findOrFail($id);

        return response()->json($router);
    }

    /**
     * Update the specified router
     */
    public function update(Request $request, $id)
    {
        $router = Router::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:100',
            'ip_address' => 'sometimes|required|ip|unique:routers,ip_address,' . $id,
            'secret' => 'sometimes|required|string|min:8',
            'type' => 'nullable|in:hotspot,pppoe,both',
            'location' => 'nullable|string|max:255',
            'status' => 'nullable|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $oldIpAddress = $router->ip_address;

        // Update router in database
        $router->update($request->only(['name', 'ip_address', 'secret', 'type', 'location', 'status']));

        // Update in FreeRADIUS NAS table if IP or secret changed
        if ($request->has('ip_address') || $request->has('secret')) {
            $this->radiusService->updateNas(
                $oldIpAddress,
                $router->name,
                $router->ip_address,
                $router->secret
            );
        }

        return response()->json([
            'message' => 'Router updated successfully',
            'router' => $router,
        ]);
    }

    /**
     * Remove the specified router
     */
    public function destroy($id)
    {
        $router = Router::findOrFail($id);

        // Delete from FreeRADIUS NAS table
        $this->radiusService->deleteNas($router->ip_address);

        // Delete router
        $router->delete();

        return response()->json([
            'message' => 'Router deleted successfully',
        ]);
    }

    /**
     * Test router connection
     */
    public function testConnection($id)
    {
        $router = Router::findOrFail($id);

        // Simple ping test
        $output = [];
        $returnVar = 0;
        exec("ping -c 1 -W 2 {$router->ip_address}", $output, $returnVar);

        $isReachable = $returnVar === 0;

        return response()->json([
            'router' => $router->name,
            'ip_address' => $router->ip_address,
            'reachable' => $isReachable,
            'message' => $isReachable ? 'Router is reachable' : 'Router is not reachable',
        ]);
    }

    /**
     * Get router statistics
     */
    public function statistics($id)
    {
        $router = Router::findOrFail($id);

        // Since clients don't have router_id, show general stats
        $stats = [
            'total_clients' => \App\Models\Client::count(),
            'active_clients' => \App\Models\Client::where('status', 'active')->count(),
            'suspended_clients' => \App\Models\Client::where('status', 'suspended')->count(),
            'terminated_clients' => \App\Models\Client::where('status', 'terminated')->count(),
        ];

        return response()->json([
            'router' => $router,
            'statistics' => $stats,
        ]);
    }
}
