<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class MikrotikConfigController extends Controller
{
    /**
     * Generate Mikrotik configuration script
     * GET /api/mikrotik-config?type=pppoe&interface=ether2
     */
    public function generate(Request $request)
    {
        $radiusHost = $request->input('radius_ip', $request->ip() === '127.0.0.1' 
            ? $this->getLocalIp() 
            : $request->getHost());
        $radiusSecret = config('radius.secret', 'testing123');
        $type = $request->input('type', 'pppoe'); // pppoe, hotspot, both
        $interface = $request->input('interface', 'ether2');
        $poolRange = $request->input('pool_range', '10.10.10.2-10.10.10.254');
        $localAddress = $request->input('local_address', '10.10.10.1');
        $dns = $request->input('dns', '8.8.8.8,8.8.4.4');

        $script = "# ============================================\n";
        $script .= "# RadiusBill - Mikrotik Auto Configuration\n";
        $script .= "# Generated: " . now()->format('Y-m-d H:i:s') . "\n";
        $script .= "# ============================================\n\n";

        // RADIUS Server
        $script .= "# RADIUS Server\n";
        $services = $type === 'both' ? 'ppp,hotspot' : $type;
        $script .= "/radius\n";
        $script .= "add address={$radiusHost} secret={$radiusSecret} service={$services} timeout=3000\n\n";

        // PPPoE
        if ($type === 'pppoe' || $type === 'both') {
            $script .= "# PPPoE Configuration\n";
            $script .= "/ip pool\n";
            $script .= "add name=pppoe-pool ranges={$poolRange}\n\n";
            $script .= "/ppp profile\n";
            $script .= "add name=radius-profile local-address={$localAddress} remote-address=pppoe-pool dns-server={$dns}\n\n";
            $script .= "/ppp aaa\n";
            $script .= "set use-radius=yes accounting=yes interim-update=5m\n\n";
            $script .= "/interface pppoe-server server\n";
            $script .= "add service-name=RadiusBill-PPPoE interface={$interface} default-profile=radius-profile disabled=no\n\n";
        }

        // Hotspot
        if ($type === 'hotspot' || $type === 'both') {
            $hotspotInterface = $request->input('hotspot_interface', 'ether3');
            $script .= "# Hotspot Configuration\n";
            $script .= "/ip pool\n";
            $script .= "add name=hotspot-pool ranges=10.20.20.2-10.20.20.254\n\n";
            $script .= "/ip hotspot profile\n";
            $script .= "set default use-radius=yes accounting=yes\n\n";
            $script .= "/ip hotspot\n";
            $script .= "add name=hotspot1 interface={$hotspotInterface} address-pool=hotspot-pool disabled=no\n\n";
        }

        // NAT
        $script .= "# NAT for clients\n";
        $script .= "/ip firewall nat\n";
        $script .= "add chain=srcnat out-interface=ether1 action=masquerade comment=\"NAT RadiusBill Clients\"\n";

        return response()->json([
            'success' => true,
            'data' => [
                'script' => $script,
                'parameters' => [
                    'radius_ip' => $radiusHost,
                    'radius_secret' => $radiusSecret,
                    'type' => $type,
                    'interface' => $interface,
                    'pool_range' => $poolRange,
                ],
            ],
        ]);
    }

    /**
     * Get local IP address
     */
    private function getLocalIp(): string
    {
        $output = shell_exec("ifconfig | grep 'inet ' | grep -v 127.0.0.1 | head -1 | awk '{print $2}'");
        return trim($output) ?: '192.168.1.100';
    }
}
