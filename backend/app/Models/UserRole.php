<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserRole extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'user_roles';

    protected $fillable = ['id', 'user_id', 'email', 'role', 'permissions', 'approved', 'approved_by', 'approved_at'];

    protected $casts = [
        'permissions' => 'array',
        'approved'    => 'boolean',
        'approved_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(fn($m) => $m->id = $m->id ?: (string) \Illuminate\Support\Str::uuid());
    }
}
