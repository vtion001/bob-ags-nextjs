<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CallSyncLog extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;
    protected $table = 'calls_sync_log';

    protected $fillable = ['id', 'user_id', 'last_sync_at', 'calls_synced', 'status', 'created_at'];

    protected $casts = ['last_sync_at' => 'datetime', 'created_at' => 'datetime'];

    protected static function boot()
    {
        parent::boot();
        static::creating(fn($m) => $m->id = $m->id ?: (string) \Illuminate\Support\Str::uuid());
    }
}
