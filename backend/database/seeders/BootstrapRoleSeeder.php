<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class BootstrapRoleSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $guard = 'api';

        // Create the admin role
        $adminRole = Role::findOrCreate('admin', $guard);

        // Get all permissions created for the API guard
        $permissions = Permission::where('guard_name', $guard)->get();

        // Give all API permissions to admin
        $adminRole->syncPermissions($permissions);

        // Create the initial admin account
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('ChangeMe123!'),
                'is_active' => true,
            ]
        );

        // Assign admin role
        if (! $admin->hasRole($adminRole)) {
            $admin->assignRole($adminRole);
        }
    }
}
