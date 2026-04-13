<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveAnalysisLog extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;
    protected $table = 'live_analysis_logs';

    protected $fillable = [
        'id', 'user_id', 'call_id', 'call_phone', 'call_direction', 'call_timestamp',
        'suggested_disposition', 'insights', 'transcript_preview', 'created_at',
    ];

    protected $casts = [
        'insights'       => 'array',
        'call_timestamp' => 'datetime',
        'created_at'     => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(fn($m) => $m->id = $m->id ?: (string) \Illuminate\Support\Str::uuid());
    }
}
