<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RadiusUserGroup extends Model
{
    use HasFactory;

    protected $table = 'radusergroup';
    public $timestamps = false;

    protected $fillable = ['username', 'groupname', 'priority'];
}
