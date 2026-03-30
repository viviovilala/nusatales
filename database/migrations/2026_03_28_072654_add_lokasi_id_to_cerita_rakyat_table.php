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
        Schema::table('cerita_rakyat', function (Blueprint $table) {
            $table->unsignedInteger('lokasi_id')->nullable()->after('sumber');

            $table->foreign('lokasi_id')
                ->references('lokasi_id')
                ->on('lokasi')
                ->cascadeOnUpdate()
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cerita_rakyat', function (Blueprint $table) {
            $table->dropForeign(['lokasi_id']);
            $table->dropColumn('lokasi_id');
        });
    }
};
