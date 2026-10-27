<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $guard = 'api';

        $permissions = [
            'users.view',
            'users.create',
            'users.update',
            'users.delete',
            'roles.view',
            'roles.create',
            'roles.update',
            'roles.delete',
            'permissions.view',
            'permissions.create',
            'permissions.update',
            'permissions.delete',
            'products.view',
            'products.create',
            'products.update',
            'products.delete',
            'sales.create',
            'sales.view',
            'sales.refund',
        ];

        foreach ($permissions as $name) {
            Permission::findOrCreate($name, $guard);
        }

        Role::findOrCreate('admin', $guard)->syncPermissions($permissions);

        Role::findOrCreate('manager', $guard)->syncPermissions([
            'products.view',
            'products.create',
            'products.update',
            'sales.create',
            'sales.view',
            'sales.refund',
        ]);

        Role::findOrCreate('cashier', $guard)->syncPermissions([
            'products.view',
            'sales.create',
            'sales.view',
        ]);

        // first admin account: CHANGE THE PASSWORD right after the first login
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name'      => 'Administrator',
                'password'  => 'ChangeMe123!',
                'is_active' => true,
            ]
        );

        $admin->syncRoles(['admin']);
    }
}
