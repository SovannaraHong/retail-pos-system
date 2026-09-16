<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class BootstrapRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $manageRoles = Permission::findOrCreate('manage-roles');

        $admin = Role::findOrCreate('admin');

        $admin->givePermissionTo($manageRoles);


        $firstUser = User::first();
        if ($firstUser && !$firstUser->hasRole('admin')) {
            $firstUser->assignRole($admin);
        }
    }
}
