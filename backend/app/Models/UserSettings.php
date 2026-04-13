<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserSettings extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'user_settings';

    protected $fillable = ['id', 'user_id', 'settings'];

    protected $casts = ['settings' => 'array'];

    protected static function boot()
    {
        parent::boot();
        static::creating(fn($m) => $m->id = $m->id ?: (string) \Illuminate\Support\Str::uuid());
    }
}
