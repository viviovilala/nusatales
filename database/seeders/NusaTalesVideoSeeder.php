<?php

namespace Database\Seeders;

use App\Models\Channel;
use App\Models\Comment;
use App\Models\Genre;
use App\Models\Kategori;
use App\Models\Region;
use App\Models\User;
use App\Models\Video;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class NusaTalesVideoSeeder extends Seeder
{
    public function run(): void
    {
        $creator = User::query()->where('email', 'creator@nusatales.test')->first();
        $uploader = User::query()->where('email', 'uploader@nusatales.test')->first();
        $commenter = User::query()->where('email', 'user@nusatales.test')->first();

        if (! $creator || ! $uploader) {
            return;
        }

        $creatorChannel = $creator->channel()->first();
        $uploaderChannel = $uploader->channel()->first();
        $category = Kategori::query()->where('slug', 'folklore')->first() ?? Kategori::query()->first();
        $regions = Region::query()->pluck('id', 'slug');
        $genres = Genre::query()->pluck('genre_id', 'slug');

        $episodeVideos = [
            ['Roro Jonggrang dan Seribu Candi', 'jawa-tengah', 9800],
            ['Timun Mas: Hutan Bambu Ajaib', 'jawa-tengah', 7600],
            ['Malin Kundang: Ombak Batu', 'sumatera-barat', 6400],
            ['Legenda Danau Toba', 'sumatera-barat', 5900],
            ['Calon Arang: Bayang Rangda', 'bali', 5200],
            ['Sangkuriang dan Tangkuban Perahu', 'jawa-timur', 4800],
        ];

        foreach ($episodeVideos as $index => [$title, $regionSlug, $views]) {
            $video = $this->video($creator, $creatorChannel, $category, $title, 'episode', [
                'region_id' => $regions[$regionSlug] ?? null,
                'view_count' => $views,
                'like_count' => 120 + ($index * 18),
                'comment_count' => 0,
                'episode_number' => $index + 1,
                'published_at' => now()->subDays($index + 1),
            ]);

            $video->genres()->sync(array_filter([
                $genres['mythology'] ?? null,
                $genres['adventure'] ?? null,
                $genres['education'] ?? null,
            ]));
        }

        $shortVideos = [
            ['Lakon Cepat: Si Kancil Menipu Buaya', 'jawa-timur', 4100],
            ['Cuplikan Wayang Modern 15 Detik', 'jawa-tengah', 3900],
            ['Tari Barong Mini Loop', 'bali', 3600],
            ['Pantun Pesisir Dalam Gerak', 'sulawesi', 2800],
        ];

        foreach ($shortVideos as $index => [$title, $regionSlug, $views]) {
            $video = $this->video($index % 2 === 0 ? $creator : $uploader, $index % 2 === 0 ? $creatorChannel : $uploaderChannel, $category, $title, 'short', [
                'region_id' => $regions[$regionSlug] ?? null,
                'view_count' => $views,
                'like_count' => 90 + ($index * 12),
                'published_at' => now()->subHours($index + 3),
            ]);

            $video->genres()->sync(array_filter([
                $genres['comedy'] ?? null,
                $genres['historical'] ?? null,
            ]));
        }

        $this->comments($commenter, Video::query()->published()->limit(8)->get());

        foreach (Channel::query()->get() as $channel) {
            $channel->forceFill([
                'video_count' => Video::query()->where('channel_id', $channel->id)->count(),
                'total_views' => (int) Video::query()->where('channel_id', $channel->id)->sum('view_count'),
            ])->save();
        }
    }

    protected function video(User $user, ?Channel $channel, ?Kategori $category, string $title, string $contentType, array $overrides = []): Video
    {
        $slug = Str::slug($title);

        return Video::query()->updateOrCreate(
            ['slug' => $slug],
            [
                'judul' => $title,
                'deskripsi' => "Demo {$contentType} NusaTales untuk {$title}.",
                'durasi' => $contentType === 'short' ? 45 : 540,
                'url_video' => "demo/videos/{$slug}.mp4",
                'video_path' => "demo/videos/{$slug}.mp4",
                'thumbnail' => null,
                'thumbnail_path' => null,
                'status' => 'published',
                'visibility' => 'public',
                'content_type' => $contentType,
                'format' => $contentType === 'short' ? 'short' : 'normal',
                'is_premium' => false,
                'coin_price' => 0,
                'monetization_type' => 'free',
                'allow_comments' => true,
                'allow_download' => false,
                'tanggal_upload' => $overrides['published_at'] ?? now(),
                'kreator_id' => $user->user_id,
                'channel_id' => $channel?->id,
                'kategori_id' => $category?->kategori_id,
                'tags' => ['nusantara', $contentType],
                ...$overrides,
            ]
        );
    }

    protected function comments(?User $commenter, $videos): void
    {
        if (! $commenter) {
            return;
        }

        foreach ($videos as $index => $video) {
            $body = [
                'Visualnya berasa hangat dan dekat dengan cerita rakyat.',
                'NusaRembug wajib ramai untuk karya seperti ini.',
                'Saya suka detail budaya yang tidak terasa menggurui.',
                'Cocok ditonton keluarga saat akhir pekan.',
                'Musiknya bikin legenda terasa hidup.',
                'Si Tompel perlu muncul di balik layar cerita ini.',
                'Episode berikutnya ditunggu.',
                'Short ini pas untuk mengenalkan cerita Nusantara.',
            ][$index] ?? 'Karya Nusantara yang menarik.';

            Comment::query()->updateOrCreate(
                [
                    'user_id' => $commenter->user_id,
                    'video_id' => $video->video_id,
                    'body' => $body,
                ],
                [
                    'isi_komentar' => $body,
                    'status' => 'published',
                    'tanggal' => now()->subMinutes($index + 1),
                    'created_at' => now()->subMinutes($index + 1),
                    'updated_at' => now()->subMinutes($index + 1),
                ]
            );

            $video->forceFill([
                'comment_count' => $video->comments()->where('status', 'published')->count(),
            ])->save();
        }
    }
}
