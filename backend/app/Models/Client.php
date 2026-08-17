<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $fillable = ['name', 'active'];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function toApiModel(): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'active' => $this->active,
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
