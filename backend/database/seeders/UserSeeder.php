<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = Role::where('name', 'admin')->where('guard_name', 'api')->first();

        $user = User::firstOrCreate(
            ['email' => 'sovannarahong123@gmail.com'],
            [
                'name' => 'Hong Sovannara',
                'password' => Hash::make('adminsovannara123'),
                'is_active' => true,
            ]
        );

        if ($adminRole && ! $user->hasRole($adminRole)) {
            $user->assignRole($adminRole);
        }
    }
}
