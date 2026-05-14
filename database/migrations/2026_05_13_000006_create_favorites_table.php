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
        Schema::create('favorites', function (Blueprint $table) {
            $table->id('favorite_id');
            $table->unsignedBigInteger('user_id');
            $table->morphs('favoritable');
            $table->timestamps();

            $table->foreign('user_id')
                ->references('user_id')
                ->on('users')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->unique(['user_id', 'favoritable_type', 'favoritable_id'], 'favorites_user_target_unique');
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('favorites');
    }
};

