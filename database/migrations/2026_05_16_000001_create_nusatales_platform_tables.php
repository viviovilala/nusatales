<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('channels')) {
            Schema::create('channels', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->unique();
                $table->string('name');
                $table->string('slug')->unique();
                $table->string('subtitle')->nullable();
                $table->text('description')->nullable();
                $table->string('avatar_path')->nullable();
                $table->string('banner_path')->nullable();
                $table->boolean('is_verified')->default(false);
                $table->enum('status', ['active', 'suspended'])->default('active');
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('channel_subscriptions')) {
            Schema::create('channel_subscriptions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('channel_id');
                $table->timestamps();
                $table->unique(['user_id', 'channel_id']);
            });
        }

        if (! Schema::hasTable('regions')) {
            Schema::create('regions', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->text('description')->nullable();
                $table->string('image_path')->nullable();
                $table->decimal('pin_x', 5, 2)->default(50);
                $table->decimal('pin_y', 5, 2)->default(50);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('tags')) {
            Schema::create('tags', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->string('slug')->unique();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('video_tag')) {
            Schema::create('video_tag', function (Blueprint $table) {
                $table->unsignedBigInteger('video_id');
                $table->unsignedBigInteger('tag_id');
                $table->primary(['video_id', 'tag_id']);
            });
        }

        if (! Schema::hasTable('video_genre')) {
            Schema::create('video_genre', function (Blueprint $table) {
                $table->unsignedBigInteger('video_id');
                $table->unsignedBigInteger('genre_id');
                $table->primary(['video_id', 'genre_id']);
            });
        }

        if (! Schema::hasTable('playlists')) {
            Schema::create('playlists', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->string('name');
                $table->boolean('is_public')->default(false);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('playlist_items')) {
            Schema::create('playlist_items', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('playlist_id');
                $table->unsignedBigInteger('video_id');
                $table->unsignedInteger('position')->default(0);
                $table->timestamps();
                $table->unique(['playlist_id', 'video_id']);
            });
        }

        if (! Schema::hasTable('watch_laters')) {
            Schema::create('watch_laters', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('video_id');
                $table->timestamps();
                $table->unique(['user_id', 'video_id']);
            });
        }

        if (! Schema::hasTable('wallets')) {
            Schema::create('wallets', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->unique();
                $table->unsignedInteger('balance')->default(0);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('wallet_transactions')) {
            Schema::create('wallet_transactions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('wallet_id')->nullable();
                $table->unsignedBigInteger('user_id');
                $table->enum('type', ['credit', 'debit']);
                $table->integer('amount');
                $table->string('description');
                $table->string('reference_type')->nullable();
                $table->unsignedBigInteger('reference_id')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('coin_packages')) {
            Schema::create('coin_packages', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('code')->unique();
                $table->unsignedInteger('coins');
                $table->unsignedInteger('bonus_coins')->default(0);
                $table->unsignedInteger('price');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('payments')) {
            Schema::create('payments', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('order_id')->unique();
                $table->string('type');
                $table->unsignedInteger('gross_amount');
                $table->string('currency', 3)->default('IDR');
                $table->string('status')->default('pending');
                $table->string('snap_token')->nullable();
                $table->string('redirect_url')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamp('paid_at')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('payment_items')) {
            Schema::create('payment_items', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('payment_id');
                $table->string('name');
                $table->unsignedInteger('quantity')->default(1);
                $table->unsignedInteger('price');
                $table->json('metadata')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('payment_webhook_logs')) {
            Schema::create('payment_webhook_logs', function (Blueprint $table) {
                $table->id();
                $table->string('provider')->default('midtrans');
                $table->string('transaction_id')->nullable()->index();
                $table->string('order_id')->nullable()->index();
                $table->json('payload');
                $table->boolean('processed')->default(false);
                $table->string('status')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('invoices')) {
            Schema::create('invoices', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('payment_id')->unique();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('invoice_number')->unique();
                $table->unsignedInteger('total');
                $table->timestamp('issued_at');
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('video_unlocks')) {
            Schema::create('video_unlocks', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('video_id')->nullable();
                $table->unsignedBigInteger('episode_id')->nullable();
                $table->unsignedInteger('coins_spent')->default(0);
                $table->timestamps();
                $table->unique(['user_id', 'video_id']);
            });
        }

        if (! Schema::hasTable('monetization_agreements')) {
            Schema::create('monetization_agreements', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->unique();
                $table->unsignedTinyInteger('creator_share_percent')->default(60);
                $table->unsignedTinyInteger('platform_share_percent')->default(40);
                $table->text('agreement_text');
                $table->timestamp('agreed_at')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('creator_revenues')) {
            Schema::create('creator_revenues', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('creator_id');
                $table->unsignedInteger('gross_amount');
                $table->unsignedInteger('creator_amount');
                $table->unsignedInteger('platform_amount');
                $table->string('source_type');
                $table->unsignedBigInteger('source_id')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('revenue_ledgers')) {
            Schema::create('revenue_ledgers', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('payment_id')->nullable();
                $table->unsignedBigInteger('creator_id')->nullable();
                $table->unsignedInteger('gross_amount');
                $table->unsignedInteger('creator_amount');
                $table->unsignedInteger('platform_amount');
                $table->string('source_type');
                $table->json('metadata')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('payout_requests')) {
            Schema::create('payout_requests', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('creator_id');
                $table->unsignedInteger('amount');
                $table->string('status')->default('pending');
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('assets')) {
            Schema::create('assets', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('creator_id')->nullable();
                $table->string('title');
                $table->string('slug')->unique();
                $table->string('category')->default('Kostum');
                $table->text('description')->nullable();
                $table->unsignedInteger('coin_price')->default(0);
                $table->unsignedInteger('price')->default(0);
                $table->string('preview_path')->nullable();
                $table->string('download_path')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('asset_orders')) {
            Schema::create('asset_orders', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('payment_id')->nullable();
                $table->unsignedInteger('total');
                $table->string('status')->default('pending');
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('asset_order_items')) {
            Schema::create('asset_order_items', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('asset_order_id');
                $table->unsignedBigInteger('asset_id');
                $table->unsignedInteger('quantity')->default(1);
                $table->unsignedInteger('price');
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('asset_downloads')) {
            Schema::create('asset_downloads', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('asset_id');
                $table->unsignedInteger('download_count')->default(0);
                $table->timestamp('last_downloaded_at')->nullable();
                $table->timestamps();
                $table->unique(['user_id', 'asset_id']);
            });
        }

        if (! Schema::hasTable('challenges')) {
            Schema::create('challenges', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->string('slug')->unique();
                $table->text('description')->nullable();
                $table->timestamp('starts_at')->nullable();
                $table->timestamp('ends_at')->nullable();
                $table->string('status')->default('active');
                $table->json('rewards')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('challenge_submissions')) {
            Schema::create('challenge_submissions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('challenge_id');
                $table->unsignedBigInteger('user_id');
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('file_path')->nullable();
                $table->unsignedInteger('votes')->default(0);
                $table->string('status')->default('submitted');
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('cultural_progress')) {
            Schema::create('cultural_progress', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->unique();
                $table->unsignedInteger('points')->default(0);
                $table->unsignedInteger('level')->default(1);
                $table->string('stage')->default('Awal Mula');
                $table->json('knowledge')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('cultural_missions')) {
            Schema::create('cultural_missions', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description')->nullable();
                $table->unsignedInteger('reward_points')->default(50);
                $table->string('status')->default('active');
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('badges')) {
            Schema::create('badges', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->text('description')->nullable();
                $table->string('icon_path')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('user_badges')) {
            Schema::create('user_badges', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('badge_id');
                $table->timestamp('earned_at')->useCurrent();
                $table->unique(['user_id', 'badge_id']);
            });
        }
    }

    public function down(): void
    {
        foreach ([
            'user_badges',
            'badges',
            'cultural_missions',
            'cultural_progress',
            'challenge_submissions',
            'challenges',
            'asset_downloads',
            'asset_order_items',
            'asset_orders',
            'assets',
            'payout_requests',
            'revenue_ledgers',
            'creator_revenues',
            'monetization_agreements',
            'video_unlocks',
            'invoices',
            'payment_webhook_logs',
            'payment_items',
            'payments',
            'coin_packages',
            'wallet_transactions',
            'wallets',
            'watch_laters',
            'playlist_items',
            'playlists',
            'video_genre',
            'video_tag',
            'tags',
            'regions',
            'channel_subscriptions',
            'channels',
        ] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
