<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('kategori', function (Blueprint $table) {
            if (! Schema::hasColumn('kategori', 'slug')) {
                $table->string('slug')->nullable()->unique()->after('nama_kategori');
            }

            if (! Schema::hasColumn('kategori', 'description')) {
                $table->text('description')->nullable()->after('slug');
            }

            if (! Schema::hasColumn('kategori', 'status')) {
                $table->enum('status', ['active', 'inactive'])->default('active')->after('description');
            }
        });

        DB::table('kategori')
            ->whereNull('slug')
            ->orderBy('kategori_id')
            ->get(['kategori_id', 'nama_kategori'])
            ->each(function ($category): void {
                $baseSlug = Str::slug($category->nama_kategori ?: "category-{$category->kategori_id}");
                $slug = $baseSlug;
                $suffix = 2;

                while (DB::table('kategori')->where('slug', $slug)->where('kategori_id', '!=', $category->kategori_id)->exists()) {
                    $slug = "{$baseSlug}-{$suffix}";
                    $suffix++;
                }

                DB::table('kategori')
                    ->where('kategori_id', $category->kategori_id)
                    ->update(['slug' => $slug]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kategori', function (Blueprint $table) {
            $columns = array_filter(['status', 'description', 'slug'], fn (string $column) => Schema::hasColumn('kategori', $column));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};

