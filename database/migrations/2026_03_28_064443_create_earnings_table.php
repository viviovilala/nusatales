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
        Schema::create('earnings', function (Blueprint $table) {
            $table->id('earning_id');
            $table->unsignedBigInteger('kreator_id');
            $table->unsignedBigInteger('video_id');
            $table->decimal('jumlah_pendapatan', 14, 2)->default(0);
            $table->date('tanggal');

            $table->foreign('kreator_id')
                ->references('user_id')
                ->on('users')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->foreign('video_id')
                ->references('video_id')
                ->on('videos')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('earnings');
    }
};
