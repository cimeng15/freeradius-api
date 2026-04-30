<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reseller extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'balance',
        'bank_name',
        'bank_account',
        'bank_account_name',
        'status',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function vouchers()
    {
        return $this->hasMany(Voucher::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    // Helper methods
    public function addBalance($amount, $description = 'Top-up balance')
    {
        $this->increment('balance', $amount);
        
        Transaction::create([
            'user_id' => $this->user_id,
            'type' => 'topup',
            'amount' => $amount,
            'description' => $description,
            'status' => 'success',
        ]);
    }

    public function deductBalance($amount, $description = 'Voucher purchase')
    {
        if ($this->balance < $amount) {
            throw new \Exception('Insufficient balance');
        }

        $this->decrement('balance', $amount);
        
        Transaction::create([
            'user_id' => $this->user_id,
            'type' => 'voucher_purchase',
            'amount' => $amount,
            'description' => $description,
            'status' => 'success',
        ]);
    }

    public function calculateCommission($amount)
    {
        return ($amount * $this->commission_rate) / 100;
    }

    public function getFormattedBalanceAttribute()
    {
        return 'Rp ' . number_format($this->balance, 0, ',', '.');
    }
}
