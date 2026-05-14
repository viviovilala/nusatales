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
        Schema::create('series', function (Blueprint $table) {
            $table->id('series_id');
            $table->unsignedBigInteger('creator_id');
            $table->unsignedBigInteger('kategori_id')->nullable();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('synopsis')->nullable();
            $table->text('description')->nullable();
            $table->string('cover_image')->nullable();
            $table->string('banner_image')->nullable();
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->unsignedSmallInteger('release_year')->nullable();
            $table->string('age_rating', 20)->nullable();
            $table->boolean('is_featured')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('creator_id')
                ->references('user_id')
                ->on('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreign('kategori_id')
                ->references('kategori_id')
                ->on('kategori')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->index(['status', 'published_at']);
            $table->index(['creator_id', 'status']);
            $table->index(['kategori_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('series');
    }
};

