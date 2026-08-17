<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    /** Valid page keys a user may be granted (mirrors the SPA PAGE_DEFS). */
    public const PAGE_KEYS = ['dsr-list', 'dsr-form', 'backup-list', 'backup-form', 'clients'];

    protected $fillable = [
        'username', 'display_name', 'role_name', 'is_admin', 'pages', 'active', 'password',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'is_admin' => 'boolean',
            'active' => 'boolean',
            'pages' => 'array',
            'password' => 'hashed',
        ];
    }

    public function isAdmin(): bool
    {
        return (bool) $this->is_admin;
    }

    /** Server-side mirror of the SPA's canAccess() guard. */
    public function canAccessPage(string $key): bool
    {
        if ($this->is_admin) {
            return true;
        }

        return is_array($this->pages) && in_array($key, $this->pages, true);
    }

    /** Shape returned to the SPA, matching the AuthSession type. */
    public function toAuthSession(): array
    {
        return [
            'id' => $this->id,
            'username' => $this->username,
            'displayName' => $this->display_name,
            'roleName' => $this->role_name,
            'isAdmin' => $this->is_admin,
            'pages' => $this->is_admin ? self::PAGE_KEYS : (array) ($this->pages ?? []),
        ];
    }

    /** Shape for the user-management list/edit (includes active + createdAt). */
    public function toUserArray(): array
    {
        return [
            'id' => (string) $this->id,
            'username' => $this->username,
            'displayName' => $this->display_name,
            'roleName' => $this->role_name,
            'pages' => (array) ($this->pages ?? []),
            'active' => $this->active,
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
