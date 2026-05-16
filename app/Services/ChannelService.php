<?php

namespace App\Services;

use App\Models\Channel;
use App\Models\User;
use Illuminate\Support\Str;

class ChannelService
{
    public function activateStudio(User $user): Channel
    {
        if ($user->relationLoaded('channel') && $user->channel) {
            return $user->channel;
        }

        $existing = $user->channel()->first();

        if ($existing) {
            return $existing;
        }

        $baseName = $user->nama ? "{$user->nama} Studio" : 'Studio NusaKarya';
        $baseSlug = Str::slug($baseName) ?: 'studio-nusakarya';
        $slug = $baseSlug;
        $counter = 1;

        while (Channel::query()->where('slug', $slug)->exists()) {
            $counter++;
            $slug = "{$baseSlug}-{$user->user_id}-{$counter}";
        }

        return Channel::query()->create([
            'user_id' => $user->user_id,
            'name' => $baseName,
            'slug' => $slug,
            'subtitle' => 'Kreator Cerita Nusantara',
            'description' => 'Channel Studio NusaKarya untuk membagikan animasi dan cerita Nusantara.',
            'status' => 'active',
            'is_verified' => false,
            'subscriber_count' => 0,
            'video_count' => 0,
            'total_views' => 0,
            'monetization_status' => 'inactive',
            'platform_fee_percentage' => 40,
            'creator_share_percentage' => 60,
        ]);
    }
}
