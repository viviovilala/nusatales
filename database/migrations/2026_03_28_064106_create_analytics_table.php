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
        Schema::create('analytics', function (Blueprint $table) {
            $table->id('analytics_id');
            $table->unsignedBigInteger('video_id');
            $table->unsignedBigInteger('views')->default(0);
            $table->unsignedBigInteger('watch_time')->default(0);
            $table->decimal('engagement_rate', 5, 2)->default(0);

            $table->foreign('video_id')
                ->references('video_id')
                ->on('videos')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->unique('video_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('analytics');
    }
};
