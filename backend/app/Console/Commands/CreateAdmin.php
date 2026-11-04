<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class CreateAdmin extends Command
{
    protected $signature = 'pos:create-admin
                            {email : Login email of the admin}
                            {--name=Administrator : Name shown in the app}';

    protected $description = 'Create an admin user, or reset the password of an existing one. The password is typed here, never stored in code.';

    public function handle(): int
    {
        $email = strtolower(trim((string) $this->argument('email')));

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('That is not a valid email address.');

            return self::FAILURE;
        }

        $role = Role::where('name', 'admin')->where('guard_name', 'api')->first();

        if (! $role) {
            $this->error('The admin role does not exist yet. Run: php artisan db:seed --class=RolePermissionSeeder');

            return self::FAILURE;
        }

        $password = (string) $this->secret('Password (at least 12 characters, typing is hidden)');

        if (mb_strlen($password) < 12) {
            $this->error('The password must be at least 12 characters.');

            return self::FAILURE;
        }

        if ($password !== (string) $this->secret('Type the password again')) {
            $this->error('The two passwords are different.');

            return self::FAILURE;
        }

        $user = User::withTrashed()->where('email', $email)->first();

        if ($user) {
            if (! $this->confirm("{$email} already exists. Reset the password and make this user an admin?")) {
                return self::SUCCESS;
            }

            if ($user->trashed()) {
                $user->restore();
            }

            $user->update(['password' => $password, 'is_active' => true]);
        } else {
            $user = User::create([
                'name'      => (string) $this->option('name'),
                'email'     => $email,
                'password'  => $password,   // hashed by the model cast
                'is_active' => true,
            ]);
        }

        $user->syncRoles([$role]);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->info("Admin ready: {$email}");

        return self::SUCCESS;
    }
}
