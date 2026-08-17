<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Dsr extends Model
{
    protected $fillable = [
        'date', 'name', 'signature', 'state',
        'uplinks', 'p2p', 'firewall', 'kb', 'chq', 'ups', 'cooling',
        'general_remarks',
    ];

    protected $casts = [
        'uplinks' => 'array',
        'p2p' => 'array',
        'firewall' => 'array',
        'kb' => 'array',
        'chq' => 'array',
        'ups' => 'array',
        'cooling' => 'array',
    ];

    /** Shape returned to the SPA, matching the DSR type (camelCase). */
    public function toApiModel(): array
    {
        return [
            'id' => (string) $this->id,
            'date' => $this->date,
            'name' => $this->name,
            'signature' => $this->signature,
            'state' => $this->state,
            'uplinks' => $this->uplinks,
            'p2p' => $this->p2p,
            'firewall' => $this->firewall,
            'kb' => $this->kb,
            'chq' => $this->chq,
            'ups' => $this->ups,
            'cooling' => $this->cooling,
            'generalRemarks' => $this->general_remarks,
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
