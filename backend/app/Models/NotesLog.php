<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotesLog extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;
    protected $table = 'notes_log';

    protected $fillable = ['id', 'call_id', 'user_id', 'notes', 'created_at'];

    protected $casts = ['created_at' => 'datetime'];

    protected static function boot()
    {
        parent::boot();
        static::creating(fn($m) => $m->id = $m->id ?: (string) \Illuminate\Support\Str::uuid());
    }
}
