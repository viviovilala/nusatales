<?php

namespace App\Services;

use App\Models\Analytics;
use App\Models\User;
use App\Models\Video;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class VideoService
{
    public function paginatePublic(array $filters): LengthAwarePaginator
    {
        return $this->baseQuery()
            ->where('status', 'published')
            ->search($filters['search'] ?? null)
            ->filterCategory(isset($filters['kategori_id']) ? (int) $filters['kategori_id'] : null)
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
            $video = Video::create([
                'judul' => $data['judul'],
                'deskripsi' => $data['deskripsi'] ?? null,
                'durasi' => $data['durasi'],
                'url_video' => $this->storeFile($data['video_file'], 'videos'),
                'thumbnail' => isset($data['thumbnail_file']) ? $this->storeFile($data['thumbnail_file'], 'thumbnails') : null,
                'status' => $data['status'] ?? 'draft',
                'tanggal_upload' => now(),
                'kreator_id' => $user->user_id,
                'kategori_id' => $data['kategori_id'] ?? null,
                'cerita_id' => $data['cerita_id'] ?? null,
            ]);

            Analytics::firstOrCreate(
                ['video_id' => $video->video_id],
                ['views' => 0, 'watch_time' => 0, 'engagement_rate' => 0]
            );

            return $video->load($this->relations());
        });
    }

    public function update(Video $video, array $data): Video
    {
        return DB::transaction(function () use ($video, $data) {
            if (isset($data['video_file']) && $data['video_file'] instanceof UploadedFile) {
                $this->deleteStoredFile($video->url_video);
                $video->url_video = $this->storeFile($data['video_file'], 'videos');
            }

            if (isset($data['thumbnail_file']) && $data['thumbnail_file'] instanceof UploadedFile) {
                $this->deleteStoredFile($video->thumbnail);
                $video->thumbnail = $this->storeFile($data['thumbnail_file'], 'thumbnails');
            }

            $video->fill([
                'judul' => $data['judul'] ?? $video->judul,
                'deskripsi' => array_key_exists('deskripsi', $data) ? $data['deskripsi'] : $video->deskripsi,
                'durasi' => $data['durasi'] ?? $video->durasi,
                'kategori_id' => array_key_exists('kategori_id', $data) ? $data['kategori_id'] : $video->kategori_id,
                'cerita_id' => array_key_exists('cerita_id', $data) ? $data['cerita_id'] : $video->cerita_id,
                'status' => $data['status'] ?? $video->status,
            ]);

            if ($video->status !== 'rejected') {
                $video->rejection_reason = null;
            }

            $video->save();

            return $video->load($this->relations());
        });
    }

    public function delete(Video $video): void
    {
        DB::transaction(function () use ($video) {
            $this->deleteStoredFile($video->url_video);
            $this->deleteStoredFile($video->thumbnail);
            $video->delete();
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

    public function findPublishedVideoOrFail(int $videoId): Video
    {
        return $this->baseQuery()
            ->where('video_id', $videoId)
            ->where('status', 'published')
            ->firstOrFail();
    }

    /**
     * @return array<int, string>
     */
    public function relations(): array
    {
        return ['creator', 'category', 'story', 'analytics'];
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
}
