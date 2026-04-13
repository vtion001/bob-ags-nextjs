<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CTMAssignment extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'ctm_assignments';

    protected $fillable = ['id', 'user_id', 'ctm_agent_id', 'ctm_user_group_id'];

    protected static function boot()
    {
        parent::boot();
        static::creating(fn($m) => $m->id = $m->id ?: (string) \Illuminate\Support\Str::uuid());
    }
}
