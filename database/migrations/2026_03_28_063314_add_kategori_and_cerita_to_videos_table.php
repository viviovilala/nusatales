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
        $shouldCreateKategoriColumn = ! Schema::hasColumn('videos', 'kategori_id');
        $shouldCreateCeritaColumn = ! Schema::hasColumn('videos', 'cerita_id');

        Schema::table('videos', function (Blueprint $table) use ($shouldCreateKategoriColumn, $shouldCreateCeritaColumn) {
            if ($shouldCreateKategoriColumn) {
                $table->unsignedBigInteger('kategori_id')->nullable()->after('kreator_id');
            }

            if ($shouldCreateCeritaColumn) {
                $table->unsignedBigInteger('cerita_id')->nullable()->after('kategori_id');
            }
        });

        Schema::table('videos', function (Blueprint $table) use ($shouldCreateKategoriColumn, $shouldCreateCeritaColumn) {
            if ($shouldCreateKategoriColumn) {
                $table->foreign('kategori_id')
                    ->references('kategori_id')
                    ->on('kategori')
                    ->cascadeOnUpdate()
                    ->nullOnDelete();
            }

            if ($shouldCreateCeritaColumn) {
                $table->foreign('cerita_id')
                    ->references('cerita_id')
                    ->on('cerita_rakyat')
                    ->cascadeOnUpdate()
                    ->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('videos', function (Blueprint $table) {
            if (Schema::hasColumn('videos', 'kategori_id')) {
                try {
                    $table->dropForeign(['kategori_id']);
                } catch (Throwable) {
                    //
                }
            }

            if (Schema::hasColumn('videos', 'cerita_id')) {
                try {
                    $table->dropForeign(['cerita_id']);
                } catch (Throwable) {
                    //
                }
            }
        });

        Schema::table('videos', function (Blueprint $table) {
            $columns = array_filter(['kategori_id', 'cerita_id'], fn (string $column) => Schema::hasColumn('videos', $column));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
