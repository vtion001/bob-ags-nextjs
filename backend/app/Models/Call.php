<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Call extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'calls';

    protected $fillable = [
        'id', 'ctm_call_id', 'user_id', 'phone', 'direction', 'duration', 'status',
        'timestamp', 'caller_number', 'tracking_number', 'tracking_label',
        'source', 'source_id', 'agent_id', 'agent_name', 'recording_url', 'transcript',
        'city', 'state', 'postal_code', 'notes', 'talk_time', 'wait_time', 'ring_time',
        'score', 'sentiment', 'summary', 'tags', 'disposition',
        'rubric_results', 'rubric_breakdown', 'synced_at',
    ];

    protected $casts = [
        'tags'             => 'array',
        'rubric_results'   => 'array',
        'rubric_breakdown' => 'array',
        'timestamp'        => 'datetime',
        'synced_at'        => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(fn($m) => $m->id = $m->id ?: (string) \Illuminate\Support\Str::uuid());
    }
}
