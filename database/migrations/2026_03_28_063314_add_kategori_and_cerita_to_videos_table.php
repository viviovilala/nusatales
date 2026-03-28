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
        Schema::table('videos', function (Blueprint $table) {
            $table->unsignedBigInteger('kategori_id')->nullable()->after('kreator_id');
            $table->unsignedBigInteger('cerita_id')->nullable()->after('kategori_id');

            $table->foreign('kategori_id')
                ->references('kategori_id')
                ->on('kategori')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->foreign('cerita_id')
                ->references('cerita_id')
                ->on('cerita_rakyat')
                ->cascadeOnUpdate()
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->dropForeign(['kategori_id']);
            $table->dropForeign(['cerita_id']);
            $table->dropColumn(['kategori_id', 'cerita_id']);
        });
    }
};
