<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuditMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Log important actions
        if (auth()->check() && in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            $action = $request->method() . ' ' . $request->path();
            
            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => $action,
                'table_name' => null,
                'record_id' => null,
                'old_values' => null,
                'new_values' => $request->except(['password', 'password_confirmation', '_token']),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        return $response;
    }
}
