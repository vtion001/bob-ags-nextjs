<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AgentProfile extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'agent_profiles';

    protected $fillable = ['id', 'user_id', 'name', 'agent_id', 'email', 'phone', 'notes'];

    protected static function boot()
    {
        parent::boot();
        static::creating(fn($m) => $m->id = $m->id ?: (string) \Illuminate\Support\Str::uuid());
    }
}
