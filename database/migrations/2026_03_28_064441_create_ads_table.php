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
        Schema::create('ads', function (Blueprint $table) {
            $table->id('ads_id');
            $table->string('nama_brand');
            $table->string('jenis_iklan');
            $table->unsignedInteger('durasi');
            $table->unsignedBigInteger('video_id')->nullable();

            $table->foreign('video_id')
                ->references('video_id')
                ->on('videos')
                ->cascadeOnUpdate()
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ads');
    }
};
