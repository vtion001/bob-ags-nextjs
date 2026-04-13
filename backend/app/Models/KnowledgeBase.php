<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KnowledgeBase extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'knowledge_base';

    protected $fillable = ['id', 'category', 'title', 'content', 'metadata', 'embedding'];

    protected $casts = ['metadata' => 'array'];

    protected static function boot()
    {
        parent::boot();
        static::creating(fn($m) => $m->id = $m->id ?: (string) \Illuminate\Support\Str::uuid());
    }
}
