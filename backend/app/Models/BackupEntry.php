<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BackupEntry extends Model
{
    protected $fillable = [
        'backup_test_id', 'client_id', 'client_name', 'logs_status', 'test_status', 'remarks',
    ];

    public function toApiModel(): array
    {
        return [
            'clientId' => (string) $this->client_id,
            'clientName' => $this->client_name,
            'logsStatus' => $this->logs_status,
            'testStatus' => $this->test_status,
            'remarks' => $this->remarks,
        ];
    }
}
