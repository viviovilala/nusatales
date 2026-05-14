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
        Schema::create('episode_progress', function (Blueprint $table) {
            $table->id('progress_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('episode_id');
            $table->unsignedInteger('progress_seconds')->default(0);
            $table->unsignedInteger('duration_seconds')->default(0);
            $table->decimal('progress_percent', 5, 2)->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('last_watched_at')->useCurrent();
            $table->timestamps();

            $table->foreign('user_id')
                ->references('user_id')
                ->on('users')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->foreign('episode_id')
                ->references('episode_id')
                ->on('episodes')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->unique(['user_id', 'episode_id']);
            $table->index(['user_id', 'last_watched_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('episode_progress');
    }
};

