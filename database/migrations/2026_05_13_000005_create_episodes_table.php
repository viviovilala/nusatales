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
        Schema::create('episodes', function (Blueprint $table) {
            $table->id('episode_id');
            $table->unsignedBigInteger('series_id');
            $table->string('title');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->unsignedInteger('episode_number');
            $table->unsignedInteger('duration_seconds')->default(0);
            $table->string('video_path');
            $table->string('thumbnail_path')->nullable();
            $table->boolean('is_premium')->default(false);
            $table->unsignedInteger('coin_price')->default(0);
            $table->unsignedInteger('preview_seconds')->nullable();
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('series_id')
                ->references('series_id')
                ->on('series')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->unique(['series_id', 'slug']);
            $table->unique(['series_id', 'episode_number']);
            $table->index(['status', 'published_at']);
            $table->index(['series_id', 'status', 'episode_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('episodes');
    }
};

