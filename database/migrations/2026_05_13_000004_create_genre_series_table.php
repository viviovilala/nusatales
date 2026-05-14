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
        Schema::create('genre_series', function (Blueprint $table) {
            $table->unsignedBigInteger('series_id');
            $table->unsignedBigInteger('genre_id');

            $table->primary(['series_id', 'genre_id']);

            $table->foreign('series_id')
                ->references('series_id')
                ->on('series')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->foreign('genre_id')
                ->references('genre_id')
                ->on('genres')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('genre_series');
    }
};

