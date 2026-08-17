<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 17 default backup-test clients (only if none exist yet).
        if (Client::count() === 0) {
            $names = [
                'Meghna Denim', 'NZ Group', 'DataSoft', 'Jovision', 'Mir Cloud',
                'Initvent Software', 'Databiz', 'Onnorokom', 'Sunlife Insurance',
                'STL', 'SFBL', 'SPL', 'UPHCS', 'Dept. Fisheries', 'Silicon ICT',
                'Saibonsoft', 'Dept. of Livestock',
            ];

            foreach ($names as $name) {
                Client::create(['name' => $name, 'active' => true, 'created_at' => '2025-01-01']);
            }
        }

        // Built-in admin (idempotent). Matches the SPA's ADMIN_CREDENTIALS.
        User::updateOrCreate(
            ['username' => 'admin'],
            [
                'display_name' => 'Administrator',
                'role_name' => 'Admin',
                'is_admin' => true,
                'pages' => User::PAGE_KEYS,
                'active' => true,
                'password' => bcrypt('Admin@2025'),
            ],
        );
    }
}
