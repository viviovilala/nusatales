<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'id')) {
                $table->renameColumn('id', 'user_id');
            }

            if (Schema::hasColumn('users', 'name')) {
                $table->renameColumn('name', 'nama');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'email_verified_at')) {
                $table->dropColumn('email_verified_at');
            }

            if (Schema::hasColumn('users', 'remember_token')) {
                $table->dropColumn('remember_token');
            }

            if (Schema::hasColumn('users', 'created_at')) {
                $table->dropColumn('created_at');
            }

            if (Schema::hasColumn('users', 'updated_at')) {
                $table->dropColumn('updated_at');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'foto_profil')) {
                $table->string('foto_profil')->nullable()->after('password');
            }

            if (! Schema::hasColumn('users', 'tanggal_daftar')) {
                $table->timestamp('tanggal_daftar')->useCurrent()->after('foto_profil');
            }

            if (! Schema::hasColumn('users', 'role')) {
                $table->enum('role', ['user', 'kreator', 'admin'])->default('user')->after('tanggal_daftar');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'role')) {
                $table->dropColumn('role');
            }

            if (Schema::hasColumn('users', 'tanggal_daftar')) {
                $table->dropColumn('tanggal_daftar');
            }

            if (Schema::hasColumn('users', 'foto_profil')) {
                $table->dropColumn('foto_profil');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'user_id')) {
                $table->renameColumn('user_id', 'id');
            }

            if (Schema::hasColumn('users', 'nama')) {
                $table->renameColumn('nama', 'name');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'email_verified_at')) {
                $table->timestamp('email_verified_at')->nullable()->after('email');
            }

            if (! Schema::hasColumn('users', 'remember_token')) {
                $table->rememberToken();
            }

            if (! Schema::hasColumn('users', 'created_at') && ! Schema::hasColumn('users', 'updated_at')) {
                $table->timestamps();
            }
        });
    }
};
