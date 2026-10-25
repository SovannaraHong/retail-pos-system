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
        //
        $manageRoles = Permission::firstOrCreate(['name' => 'manage-roles']);
        $manageUsers = Permission::firstOrCreate(['name' => 'manage-users']);
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->syncPermissions([$manageRoles, $manageUsers]);

        $user = User::firstOrCreate(
            ['email' => 'admin@pos.test'],
            ['name' => 'Admin', 'password' => 'password123', 'is_active' => true]
        );
        $user->assignRole($admin);
    }
}
