<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

// Serve React app
Route::get('/{any}', function () {
    $indexPath = public_path('app/index.html');
    
    if (file_exists($indexPath)) {
        return response()->file($indexPath);
    }
    
    return response()->json([
        'error' => 'Frontend not built',
        'message' => 'Please run: cd frontend && npm install && npm run build'
    ], 503);
})->where('any', '^(?!api|storage).*$');
