<?php

namespace App\Services;

use App\Models\Analytics;
use App\Models\User;
use App\Models\Video;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class VideoService
{
    public function __construct(
        protected ChannelService $channelService
    ) {
    }

    public function paginatePublic(array $filters): LengthAwarePaginator
    {
        return $this->baseQuery()
            ->published()
            ->publiclyVisible()
            ->search($filters['search'] ?? $filters['keyword'] ?? null)
            ->when($filters['content_type'] ?? null, fn ($query, $type) => $query->where('content_type', $type))
            ->filterCategory(isset($filters['kategori_id']) ? (int) $filters['kategori_id'] : (isset($filters['category_id']) ? (int) $filters['category_id'] : null))
            ->when(isset($filters['genre_id']), fn ($query) => $query->whereHas('genres', fn ($genreQuery) => $genreQuery->where('genres.genre_id', $filters['genre_id'])))
            ->when(isset($filters['region_id']), fn ($query) => $query->where('region_id', $filters['region_id']))
            ->orderByDesc('published_at')
            ->orderByDesc('tanggal_upload')
            ->paginate($filters['per_page'] ?? 15)
            ->withQueryString();
    }

    public function paginateForCreator(User $user, array $filters): LengthAwarePaginator
    {
        return $this->baseQuery()
            ->where('kreator_id', $user->user_id)
            ->search($filters['search'] ?? null)
            ->filterStatus($filters['status'] ?? null)
            ->filterCategory(isset($filters['kategori_id']) ? (int) $filters['kategori_id'] : null)
            ->orderByDesc('tanggal_upload')
            ->paginate($filters['per_page'] ?? 15)
            ->withQueryString();
    }

    public function paginateForAdmin(array $filters): LengthAwarePaginator
    {
        return $this->baseQuery()
            ->search($filters['search'] ?? null)
            ->filterStatus($filters['status'] ?? null)
            ->filterCategory(isset($filters['kategori_id']) ? (int) $filters['kategori_id'] : null)
            ->when(isset($filters['kreator_id']), fn ($query) => $query->where('kreator_id', $filters['kreator_id']))
            ->orderByDesc('tanggal_upload')
            ->paginate($filters['per_page'] ?? 15)
            ->withQueryString();
    }

    public function create(User $user, array $data): Video
    {
        return DB::transaction(function () use ($user, $data) {
            $channel = $this->channelService->activateStudio($user);
            $contentType = $data['content_type'] ?? 'episode';
            $status = $data['status'] ?? 'draft';
            $visibility = $data['visibility'] ?? 'public';
            $isPremium = (bool) ($data['is_premium'] ?? false);
            $coinPrice = (int) ($data['coin_price'] ?? 0);

            if (($isPremium || $coinPrice > 0) && $channel->monetization_status !== 'active') {
                throw ValidationException::withMessages([
                    'monetization' => ['Aktifkan perjanjian monetisasi 60/40 sebelum mengunggah konten premium.'],
                ]);
            }

            $videoPath = $this->storeFile($data['video_file'], 'videos');
            $thumbnailPath = isset($data['thumbnail_file']) ? $this->storeFile($data['thumbnail_file'], 'thumbnails') : null;

            $video = Video::create([
                'judul' => $data['judul'],
                'slug' => $this->uniqueSlug($data['judul']),
                'deskripsi' => $data['deskripsi'] ?? null,
                'durasi' => (int) ($data['durasi'] ?? 0),
                'url_video' => $videoPath,
                'video_path' => $videoPath,
                'thumbnail' => $thumbnailPath,
                'thumbnail_path' => $thumbnailPath,
                'status' => $status,
                'visibility' => $visibility,
                'scheduled_at' => $status === 'scheduled' ? $data['scheduled_at'] : null,
                'published_at' => $status === 'published' ? now() : null,
                'content_type' => $contentType,
                'format' => $contentType === 'short' ? 'short' : 'normal',
                'is_premium' => $isPremium,
                'monetization_type' => $isPremium ? ($data['monetization_type'] ?? 'coin_unlock') : 'free',
                'coin_price' => $coinPrice,
                'is_monetized' => $isPremium || $coinPrice > 0,
                'monetization_status' => ($isPremium || $coinPrice > 0) ? 'active' : 'inactive',
                'allow_comments' => (bool) ($data['allow_comments'] ?? true),
                'allow_download' => (bool) ($data['allow_download'] ?? false),
                'tanggal_upload' => now(),
                'kreator_id' => $user->user_id,
                'channel_id' => $channel->id,
                'kategori_id' => $data['kategori_id'] ?? null,
                'cerita_id' => $data['cerita_id'] ?? null,
                'series_id' => $data['series_id'] ?? null,
                'episode_number' => $data['episode_number'] ?? null,
                'region_id' => $data['region_id'] ?? null,
                'folklore_type' => $data['folklore_type'] ?? null,
                'tags' => $data['tags'] ?? [],
            ]);

            if (! empty($data['genre_ids'])) {
                $video->genres()->sync($data['genre_ids']);
            }

            Analytics::firstOrCreate(
                ['video_id' => $video->video_id],
                ['views' => 0, 'watch_time' => 0, 'engagement_rate' => 0]
            );

            $this->refreshChannelStats($channel->id);

            return $video->load($this->relations());
        });
    }

    public function update(Video $video, array $data): Video
    {
        return DB::transaction(function () use ($video, $data) {
            $channel = $video->channel ?: ($video->creator ? $this->channelService->activateStudio($video->creator) : null);

            if ($channel && (($data['is_premium'] ?? $video->is_premium) || (int) ($data['coin_price'] ?? $video->coin_price) > 0) && $channel->monetization_status !== 'active') {
                throw ValidationException::withMessages([
                    'monetization' => ['Aktifkan perjanjian monetisasi 60/40 sebelum mengaktifkan konten premium.'],
                ]);
            }

            if (isset($data['video_file']) && $data['video_file'] instanceof UploadedFile) {
                $this->deleteStoredFile($video->url_video);
                $videoPath = $this->storeFile($data['video_file'], 'videos');
                $video->url_video = $videoPath;
                $video->video_path = $videoPath;
            }

            if (isset($data['thumbnail_file']) && $data['thumbnail_file'] instanceof UploadedFile) {
                $this->deleteStoredFile($video->thumbnail);
                $thumbnailPath = $this->storeFile($data['thumbnail_file'], 'thumbnails');
                $video->thumbnail = $thumbnailPath;
                $video->thumbnail_path = $thumbnailPath;
            }

            $contentType = $data['content_type'] ?? $video->content_type ?? 'episode';

            $video->fill([
                'judul' => $data['judul'] ?? $video->judul,
                'deskripsi' => array_key_exists('deskripsi', $data) ? $data['deskripsi'] : $video->deskripsi,
                'durasi' => $data['durasi'] ?? $video->durasi,
                'kategori_id' => array_key_exists('kategori_id', $data) ? $data['kategori_id'] : $video->kategori_id,
                'cerita_id' => array_key_exists('cerita_id', $data) ? $data['cerita_id'] : $video->cerita_id,
                'status' => $data['status'] ?? $video->status,
                'visibility' => $data['visibility'] ?? $video->visibility,
                'content_type' => $contentType,
                'format' => $contentType === 'short' ? 'short' : 'normal',
                'scheduled_at' => array_key_exists('scheduled_at', $data) ? $data['scheduled_at'] : $video->scheduled_at,
                'is_premium' => array_key_exists('is_premium', $data) ? (bool) $data['is_premium'] : $video->is_premium,
                'monetization_type' => $data['monetization_type'] ?? $video->monetization_type,
                'coin_price' => array_key_exists('coin_price', $data) ? (int) $data['coin_price'] : $video->coin_price,
                'allow_comments' => array_key_exists('allow_comments', $data) ? (bool) $data['allow_comments'] : $video->allow_comments,
                'allow_download' => array_key_exists('allow_download', $data) ? (bool) $data['allow_download'] : $video->allow_download,
                'series_id' => array_key_exists('series_id', $data) ? $data['series_id'] : $video->series_id,
                'episode_number' => array_key_exists('episode_number', $data) ? $data['episode_number'] : $video->episode_number,
                'region_id' => array_key_exists('region_id', $data) ? $data['region_id'] : $video->region_id,
                'folklore_type' => array_key_exists('folklore_type', $data) ? $data['folklore_type'] : $video->folklore_type,
                'tags' => array_key_exists('tags', $data) ? $data['tags'] : $video->tags,
            ]);

            if (($data['judul'] ?? null) && $data['judul'] !== $video->getOriginal('judul')) {
                $video->slug = $this->uniqueSlug($data['judul'], $video->video_id);
            }

            if ($video->status !== 'rejected') {
                $video->rejection_reason = null;
            }

            if ($video->status === 'published' && ! $video->published_at) {
                $video->published_at = now();
            }

            $video->is_monetized = $video->is_premium || $video->coin_price > 0;
            $video->monetization_status = $video->is_monetized ? 'active' : 'inactive';

            $video->save();

            if (! empty($data['genre_ids'])) {
                $video->genres()->sync($data['genre_ids']);
            }

            return $video->load($this->relations());
        });
    }

    public function delete(Video $video): void
    {
        DB::transaction(function () use ($video) {
            $this->deleteStoredFile($video->url_video);
            $this->deleteStoredFile($video->thumbnail);
            $channelId = $video->channel_id;
            $video->delete();

            if ($channelId) {
                $this->refreshChannelStats($channelId);
            }
        });
    }

    public function updateStatus(Video $video, string $status, ?string $rejectionReason = null): Video
    {
        $video->update([
            'status' => $status,
            'rejection_reason' => $status === 'rejected' ? $rejectionReason : null,
        ]);

        return $video->load($this->relations());
    }

    public function findCreatorVideoOrFail(User $user, int $videoId): Video
    {
        return $this->baseQuery()
            ->where('video_id', $videoId)
            ->where('kreator_id', $user->user_id)
            ->firstOrFail();
    }

    public function findAdminVideoOrFail(int $videoId): Video
    {
        return $this->baseQuery()->where('video_id', $videoId)->firstOrFail();
    }

    public function findPublishedVideoOrFail(int|string $videoId): Video
    {
        return $this->baseQuery()
            ->where(fn ($query) => is_numeric($videoId)
                ? $query->where('video_id', $videoId)->orWhere('slug', (string) $videoId)
                : $query->where('slug', $videoId))
            ->published()
            ->publiclyVisible()
            ->firstOrFail();
    }

    /**
     * @return array<int, string>
     */
    public function relations(): array
    {
        return ['creator.channel', 'channel', 'category', 'story', 'analytics', 'genres', 'region', 'series'];
    }

    protected function baseQuery()
    {
        return Video::query()
            ->with($this->relations())
            ->withCount(['likes', 'comments', 'shares']);
    }

    protected function storeFile(UploadedFile $file, string $directory): string
    {
        return $file->store($directory, 'public');
    }

    protected function deleteStoredFile(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    protected function uniqueSlug(string $title, ?int $ignoreVideoId = null): string
    {
        $base = Str::slug($title) ?: 'video';
        $slug = $base;
        $counter = 1;

        while (Video::query()
            ->where('slug', $slug)
            ->when($ignoreVideoId, fn ($query) => $query->where('video_id', '!=', $ignoreVideoId))
            ->exists()) {
            $counter++;
            $slug = "{$base}-{$counter}";
        }

        return $slug;
    }

    protected function refreshChannelStats(int $channelId): void
    {
        DB::table('channels')
            ->where('id', $channelId)
            ->update([
                'video_count' => Video::query()->where('channel_id', $channelId)->count(),
                'total_views' => (int) Video::query()->where('channel_id', $channelId)->sum('view_count'),
                'updated_at' => now(),
            ]);
    }
}
