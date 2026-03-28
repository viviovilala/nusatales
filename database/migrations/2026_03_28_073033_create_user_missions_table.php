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
        Schema::create('user_missions', function (Blueprint $table) {
            $table->id('user_mission_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('mission_id');
            $table->unsignedInteger('progress')->default(0);
            $table->enum('status', ['ongoing', 'completed'])->default('ongoing');
            $table->date('tanggal');

            $table->foreign('user_id')
                ->references('user_id')
                ->on('users')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->foreign('mission_id')
                ->references('mission_id')
                ->on('daily_missions')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_missions');
    }
};
