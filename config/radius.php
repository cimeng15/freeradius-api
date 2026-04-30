<?php

return [
    /*
    |--------------------------------------------------------------------------
    | FreeRADIUS Server Configuration
    |--------------------------------------------------------------------------
    |
    | Konfigurasi koneksi ke FreeRADIUS server.
    | Di lokal: FreeRADIUS jalan di Docker (localhost)
    | Di production: FreeRADIUS jalan di server yang sama atau server terpisah
    |
    */

    'host' => env('RADIUS_HOST', '127.0.0.1'),
    'auth_port' => env('RADIUS_AUTH_PORT', 1812),
    'acct_port' => env('RADIUS_ACCT_PORT', 1813),
    'secret' => env('RADIUS_SECRET', 'testing123'),

    /*
    |--------------------------------------------------------------------------
    | Default NAS Type
    |--------------------------------------------------------------------------
    */
    'default_nas_type' => 'mikrotik',
];
