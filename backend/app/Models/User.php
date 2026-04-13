<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;

    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'users';

    protected $fillable = ['id', 'email', 'password', 'full_name', 'avatar_url', 'is_superadmin', 'remember_token'];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = ['is_superadmin' => 'boolean'];

    protected static function boot()
    {
        parent::boot();
        static::creating(fn($m) => $m->id = $m->id ?: (string) \Illuminate\Support\Str::uuid());
    }

    public function role()
    {
        return $this->hasOne(UserRole::class, 'user_id');
    }

    public function settings()
    {
        return $this->hasOne(UserSettings::class, 'user_id');
    }
}
