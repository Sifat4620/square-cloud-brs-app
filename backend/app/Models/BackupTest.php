<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BackupTest extends Model
{
    protected $fillable = [
        'year', 'month', 'state',
        'responsible_name', 'responsible_designation', 'date', 'signature',
    ];

    protected $casts = [
        'year' => 'integer',
        'month' => 'integer',
    ];

    public function entries()
    {
        return $this->hasMany(BackupEntry::class);
    }

    public function toApiModel(): array
    {
        return [
            'id' => (string) $this->id,
            'year' => $this->year,
            'month' => $this->month,
            'state' => $this->state,
            'responsibleName' => $this->responsible_name,
            'responsibleDesignation' => $this->responsible_designation,
            'date' => $this->date,
            'signature' => $this->signature,
            'entries' => $this->entries->map(fn (BackupEntry $e) => $e->toApiModel())->all(),
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
