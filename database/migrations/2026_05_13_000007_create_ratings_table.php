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
        Schema::create('ratings', function (Blueprint $table) {
            $table->id('rating_id');
            $table->unsignedBigInteger('user_id');
            $table->morphs('rateable');
            $table->unsignedTinyInteger('score');
            $table->text('review')->nullable();
            $table->enum('status', ['published', 'hidden'])->default('published');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('user_id')
                ->references('user_id')
                ->on('users')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->unique(['user_id', 'rateable_type', 'rateable_id'], 'ratings_user_target_unique');
            $table->index(['rateable_type', 'rateable_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ratings');
    }
};

