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
        Schema::create('cerita_rakyat', function (Blueprint $table) {
            $table->id('cerita_id');
            $table->string('judul_cerita');
            $table->string('asal_daerah');
            $table->text('deskripsi')->nullable();
            $table->text('pesan_moral')->nullable();
            $table->string('sumber')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cerita_rakyat');
    }
};
