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
        Schema::create('videos', function (Blueprint $table) {
            $table->id('video_id');
            $table->string('judul');
            $table->text('deskripsi')->nullable();
            $table->unsignedInteger('durasi');
            $table->string('url_video');
            $table->string('thumbnail')->nullable();
            $table->timestamp('tanggal_upload')->useCurrent();

            $table->unsignedBigInteger('kreator_id');
           
            $table->foreign('kreator_id')
                ->references('user_id')
                ->on('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('videos');
    }
};
