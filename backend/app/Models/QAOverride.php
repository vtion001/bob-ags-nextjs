<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QAOverride extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'qa_overrides';

    protected $fillable = ['id', 'call_id', 'ctm_call_id', 'user_id', 'overrides', 'manual_score', 'ai_score', 'notes'];

    protected $casts = ['overrides' => 'array'];

    protected static function boot()
    {
        parent::boot();
        static::creating(fn($m) => $m->id = $m->id ?: (string) \Illuminate\Support\Str::uuid());
    }
}
