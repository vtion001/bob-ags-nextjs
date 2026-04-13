<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CallNote extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'call_notes';

    protected $fillable = ['id', 'call_id', 'notes'];

    protected static function boot()
    {
        parent::boot();
        static::creating(fn($m) => $m->id = $m->id ?: (string) \Illuminate\Support\Str::uuid());
    }
}
