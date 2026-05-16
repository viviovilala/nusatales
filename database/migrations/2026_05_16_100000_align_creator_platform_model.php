<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'role')) {
            DB::table('users')->where('role', 'creator')->update(['role' => 'user']);

            if (DB::getDriverName() === 'mysql') {
                DB::statement("ALTER TABLE users MODIFY role ENUM('user', 'admin') NOT NULL DEFAULT 'user'");
            }
        }

        if (Schema::hasTable('channels')) {
            Schema::table('channels', function (Blueprint $table) {
                if (! Schema::hasColumn('channels', 'description')) {
                    $table->text('description')->nullable()->after('subtitle');
                }

                if (! Schema::hasColumn('channels', 'avatar')) {
                    $table->string('avatar')->nullable()->after('description');
                }

                if (! Schema::hasColumn('channels', 'banner')) {
                    $table->string('banner')->nullable()->after('avatar');
                }

                if (! Schema::hasColumn('channels', 'location')) {
                    $table->string('location')->nullable()->after('banner');
                }

                if (! Schema::hasColumn('channels', 'social_links')) {
                    $table->json('social_links')->nullable()->after('location');
                }

                if (! Schema::hasColumn('channels', 'subscriber_count')) {
                    $table->unsignedInteger('subscriber_count')->default(0)->after('is_verified');
                }

                if (! Schema::hasColumn('channels', 'video_count')) {
                    $table->unsignedInteger('video_count')->default(0)->after('subscriber_count');
                }

                if (! Schema::hasColumn('channels', 'total_views')) {
                    $table->unsignedBigInteger('total_views')->default(0)->after('video_count');
                }

                if (! Schema::hasColumn('channels', 'monetization_status')) {
                    $table->enum('monetization_status', ['inactive', 'pending_review', 'active', 'rejected', 'suspended'])
                        ->default('inactive')
                        ->after('total_views');
                }

                if (! Schema::hasColumn('channels', 'monetization_enabled_at')) {
                    $table->timestamp('monetization_enabled_at')->nullable()->after('monetization_status');
                }

                if (! Schema::hasColumn('channels', 'monetization_agreed_at')) {
                    $table->timestamp('monetization_agreed_at')->nullable()->after('monetization_enabled_at');
                }

                if (! Schema::hasColumn('channels', 'platform_fee_percentage')) {
                    $table->decimal('platform_fee_percentage', 5, 2)->default(40)->after('monetization_agreed_at');
                }

                if (! Schema::hasColumn('channels', 'creator_share_percentage')) {
                    $table->decimal('creator_share_percentage', 5, 2)->default(60)->after('platform_fee_percentage');
                }
            });

            if (DB::getDriverName() === 'mysql' && Schema::hasColumn('channels', 'status')) {
                DB::statement("ALTER TABLE channels MODIFY status ENUM('pending', 'active', 'suspended') NOT NULL DEFAULT 'active'");
            }
        }

        if (Schema::hasTable('videos')) {
            Schema::table('videos', function (Blueprint $table) {
                if (! Schema::hasColumn('videos', 'slug')) {
                    $table->string('slug')->nullable()->unique()->after('judul');
                }

                if (! Schema::hasColumn('videos', 'channel_id')) {
                    $table->unsignedBigInteger('channel_id')->nullable()->after('kreator_id')->index();
                }

                if (! Schema::hasColumn('videos', 'content_type')) {
                    $table->enum('content_type', ['episode', 'short'])->default('episode')->after('channel_id');
                }

                if (! Schema::hasColumn('videos', 'format')) {
                    $table->enum('format', ['normal', 'short'])->nullable()->after('content_type');
                }

                if (! Schema::hasColumn('videos', 'video_path')) {
                    $table->string('video_path')->nullable()->after('url_video');
                }

                if (! Schema::hasColumn('videos', 'video_url')) {
                    $table->string('video_url')->nullable()->after('video_path');
                }

                if (! Schema::hasColumn('videos', 'thumbnail_path')) {
                    $table->string('thumbnail_path')->nullable()->after('thumbnail');
                }

                if (! Schema::hasColumn('videos', 'visibility')) {
                    $table->enum('visibility', ['public', 'unlisted', 'private'])->default('public')->after('thumbnail_path');
                }

                if (! Schema::hasColumn('videos', 'scheduled_at')) {
                    $table->timestamp('scheduled_at')->nullable()->after('rejection_reason');
                }

                if (! Schema::hasColumn('videos', 'published_at')) {
                    $table->timestamp('published_at')->nullable()->after('scheduled_at');
                }

                if (! Schema::hasColumn('videos', 'is_premium')) {
                    $table->boolean('is_premium')->default(false)->after('published_at');
                }

                if (! Schema::hasColumn('videos', 'monetization_type')) {
                    $table->enum('monetization_type', ['free', 'coin_unlock', 'subscription_only', 'coin_or_subscription'])
                        ->default('free')
                        ->after('is_premium');
                }

                if (! Schema::hasColumn('videos', 'coin_price')) {
                    $table->unsignedInteger('coin_price')->default(0)->after('monetization_type');
                }

                if (! Schema::hasColumn('videos', 'is_monetized')) {
                    $table->boolean('is_monetized')->default(false)->after('coin_price');
                }

                if (! Schema::hasColumn('videos', 'monetization_status')) {
                    $table->enum('monetization_status', ['inactive', 'active', 'suspended'])->default('inactive')->after('is_monetized');
                }

                if (! Schema::hasColumn('videos', 'allow_comments')) {
                    $table->boolean('allow_comments')->default(true)->after('monetization_status');
                }

                if (! Schema::hasColumn('videos', 'allow_download')) {
                    $table->boolean('allow_download')->default(false)->after('allow_comments');
                }

                if (! Schema::hasColumn('videos', 'view_count')) {
                    $table->unsignedBigInteger('view_count')->default(0)->after('allow_download');
                }

                if (! Schema::hasColumn('videos', 'like_count')) {
                    $table->unsignedInteger('like_count')->default(0)->after('view_count');
                }

                if (! Schema::hasColumn('videos', 'comment_count')) {
                    $table->unsignedInteger('comment_count')->default(0)->after('like_count');
                }

                if (! Schema::hasColumn('videos', 'series_id')) {
                    $table->unsignedBigInteger('series_id')->nullable()->after('comment_count')->index();
                }

                if (! Schema::hasColumn('videos', 'episode_number')) {
                    $table->unsignedInteger('episode_number')->nullable()->after('series_id');
                }

                if (! Schema::hasColumn('videos', 'region_id')) {
                    $table->unsignedBigInteger('region_id')->nullable()->after('episode_number')->index();
                }

                if (! Schema::hasColumn('videos', 'folklore_type')) {
                    $table->string('folklore_type')->nullable()->after('region_id');
                }

                if (! Schema::hasColumn('videos', 'tags')) {
                    $table->json('tags')->nullable()->after('folklore_type');
                }
            });

            if (DB::getDriverName() === 'mysql' && Schema::hasColumn('videos', 'status')) {
                DB::statement("ALTER TABLE videos MODIFY status ENUM('draft', 'published', 'scheduled', 'archived', 'blocked', 'rejected') NOT NULL DEFAULT 'draft'");
            }
        }

        if (Schema::hasTable('series')) {
            Schema::table('series', function (Blueprint $table) {
                if (! Schema::hasColumn('series', 'channel_id')) {
                    $table->unsignedBigInteger('channel_id')->nullable()->after('creator_id')->index();
                }
            });
        }

        if (Schema::hasTable('comments')) {
            Schema::table('comments', function (Blueprint $table) {
                if (! Schema::hasColumn('comments', 'episode_id')) {
                    $table->unsignedBigInteger('episode_id')->nullable()->after('video_id')->index();
                }

                if (! Schema::hasColumn('comments', 'parent_id')) {
                    $table->unsignedBigInteger('parent_id')->nullable()->after('episode_id')->index();
                }

                if (! Schema::hasColumn('comments', 'body')) {
                    $table->text('body')->nullable()->after('isi_komentar');
                }

                if (! Schema::hasColumn('comments', 'status')) {
                    $table->enum('status', ['published', 'hidden', 'reported', 'deleted'])->default('published')->after('body');
                }

                if (! Schema::hasColumn('comments', 'created_at')) {
                    $table->timestamp('created_at')->nullable()->after('tanggal');
                }

                if (! Schema::hasColumn('comments', 'updated_at')) {
                    $table->timestamp('updated_at')->nullable()->after('created_at');
                }

                if (! Schema::hasColumn('comments', 'deleted_at')) {
                    $table->timestamp('deleted_at')->nullable()->after('updated_at');
                }
            });
        }

        if (Schema::hasTable('monetization_agreements')) {
            Schema::table('monetization_agreements', function (Blueprint $table) {
                if (! Schema::hasColumn('monetization_agreements', 'channel_id')) {
                    $table->unsignedBigInteger('channel_id')->nullable()->after('user_id')->index();
                }

                if (! Schema::hasColumn('monetization_agreements', 'agreed')) {
                    $table->boolean('agreed')->default(true)->after('channel_id');
                }

                if (! Schema::hasColumn('monetization_agreements', 'platform_percentage')) {
                    $table->decimal('platform_percentage', 5, 2)->default(40)->after('agreed');
                }

                if (! Schema::hasColumn('monetization_agreements', 'creator_percentage')) {
                    $table->decimal('creator_percentage', 5, 2)->default(60)->after('platform_percentage');
                }

                if (! Schema::hasColumn('monetization_agreements', 'ip_address')) {
                    $table->string('ip_address', 45)->nullable()->after('agreement_text');
                }

                if (! Schema::hasColumn('monetization_agreements', 'user_agent')) {
                    $table->text('user_agent')->nullable()->after('ip_address');
                }
            });
        }
    }

    public function down(): void
    {
        // This alignment migration is intentionally one-way to avoid dropping live data.
    }
};
