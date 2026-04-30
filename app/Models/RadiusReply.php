<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RadiusReply extends Model
{
    use HasFactory;

    protected $table = 'radreply';
    public $timestamps = false;

    protected $fillable = ['username', 'attribute', 'op', 'value'];
}
