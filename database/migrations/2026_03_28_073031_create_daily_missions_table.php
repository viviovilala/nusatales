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
        Schema::create('daily_missions', function (Blueprint $table) {
            $table->id('mission_id');
            $table->string('judul', 150);
            $table->text('deskripsi')->nullable();
            $table->unsignedInteger('target');
            $table->enum('tipe', ['watch', 'like', 'comment']);
            $table->unsignedInteger('reward_point');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_missions');
    }
};
