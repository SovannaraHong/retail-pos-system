<?php

namespace Database\Seeders;

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
            // admin area
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
            // catalog
            'categories.view',
            'categories.create',
            'categories.update',
            'categories.delete',
            'brands.view',
            'brands.create',
            'brands.update',
            'brands.delete',
            'suppliers.view',
            'suppliers.create',
            'suppliers.update',
            'suppliers.delete',
            'products.view',
            'products.create',
            'products.update',
            'products.delete',
            // people
            'customers.view',
            'customers.create',
            'customers.update',
            'customers.delete',
            // stock
            'purchases.view',
            'purchases.create',
            'purchases.update',
            'stock.view',
            'stock.adjust',
            // selling
            'sales.create',
            'sales.view',
            'sales.refund',
            'sales.void',
            'sales.discount',
            'shifts.open',
            'shifts.close',
            'shifts.view',
            // money and reports
            'expenses.view',
            'expenses.create',
            'expenses.delete',
            'reports.view',
            'settings.view',
            'settings.update',
        ];

        foreach ($permissions as $name) {
            Permission::findOrCreate($name, $guard);
        }

        Role::findOrCreate('admin', $guard)->syncPermissions($permissions);

        Role::findOrCreate('manager', $guard)->syncPermissions([
            'categories.view',
            'categories.create',
            'categories.update',
            'brands.view',
            'brands.create',
            'brands.update',
            'suppliers.view',
            'suppliers.create',
            'suppliers.update',
            'products.view',
            'products.create',
            'products.update',
            'customers.view',
            'customers.create',
            'customers.update',
            'purchases.view',
            'purchases.create',
            'purchases.update',
            'stock.view',
            'stock.adjust',
            'sales.create',
            'sales.view',
            'sales.refund',
            'sales.void',
            'sales.discount',
            'shifts.view',
            'expenses.view',
            'expenses.create',
            'reports.view',
        ]);

        Role::findOrCreate('cashier', $guard)->syncPermissions([
            'categories.view',
            'brands.view',
            'products.view',
            'customers.view',
            'customers.create',
            'sales.create',
            'sales.view',
            'shifts.open',
            'shifts.close',
        ]);

        // NO default admin account here on purpose (no password in code).
        // Create yours with:  php artisan pos:create-admin you@yourshop.com
    }
}
