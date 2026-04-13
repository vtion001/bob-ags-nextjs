<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'email' => 'v.rodriguez@allianceglobalsolutions.com',
                'password' => 'vrodriguez2026@@',
                'full_name' => 'V. Rodriguez',
                'role' => 'admin',
                'is_superadmin' => true,
            ],
            [
                'email' => 'allyssa@allianceglobalsolutions.com',
                'password' => 'allyssa2026@@',
                'full_name' => 'Allyssa',
                'role' => 'qa',
                'is_superadmin' => false,
            ],
            [
                'email' => 'kiel@allianceglobalsolutions.com',
                'password' => 'kiel2026@@',
                'full_name' => 'Kiel',
                'role' => 'viewer',
                'is_superadmin' => false,
            ],
            [
                'email' => 'jd@allianceglobalsolutions.com',
                'password' => 'jd2026@@',
                'full_name' => 'JD',
                'role' => 'viewer',
                'is_superadmin' => false,
            ],
        ];

        $rolePermissions = [
            'admin' => [
                'can_view_calls' => true,
                'can_view_monitor' => true,
                'can_view_history' => true,
                'can_view_agents' => true,
                'can_manage_settings' => true,
                'can_manage_users' => true,
                'can_run_analysis' => true,
            ],
            'qa' => [
                'can_view_calls' => true,
                'can_view_monitor' => true,
                'can_view_history' => true,
                'can_view_agents' => true,
                'can_manage_settings' => false,
                'can_manage_users' => false,
                'can_run_analysis' => true,
            ],
            'viewer' => [
                'can_view_calls' => true,
                'can_view_monitor' => true,
                'can_view_history' => false,
                'can_view_agents' => false,
                'can_manage_settings' => false,
                'can_manage_users' => false,
                'can_run_analysis' => false,
            ],
            'manager' => [
                'can_view_calls' => true,
                'can_view_monitor' => true,
                'can_view_history' => true,
                'can_view_agents' => true,
                'can_manage_settings' => false,
                'can_manage_users' => false,
                'can_run_analysis' => true,
            ],
            'agent' => [
                'can_view_calls' => false,
                'can_view_monitor' => true,
                'can_view_history' => false,
                'can_view_agents' => false,
                'can_manage_settings' => false,
                'can_manage_users' => false,
                'can_run_analysis' => false,
            ],
        ];

        foreach ($users as $userData) {
            $role = $userData['role'];
            $permissions = $rolePermissions[$role] ?? $rolePermissions['viewer'];

            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'password' => Hash::make($userData['password']),
                    'full_name' => $userData['full_name'],
                    'is_superadmin' => $userData['is_superadmin'],
                ]
            );

            UserRole::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'email' => strtolower($userData['email']),
                    'role' => $role,
                    'approved' => true,
                    'permissions' => $permissions,
                ]
            );

            $this->command->info("Created user: {$userData['email']} ({$role})");
        }
    }
}
