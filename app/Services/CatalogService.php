<?php

namespace App\Services;

use App\Models\Episode;
use App\Models\EpisodeProgress;
use App\Models\Favorite;
use App\Models\Genre;
use App\Models\Rating;
use App\Models\Series;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\DB;

class CatalogService
{
    public function genres()
    {
        return Genre::query()
            ->active()
            ->orderBy('name')
            ->get();
    }

    public function paginateSeries(array $filters): LengthAwarePaginator
    {
        return $this->seriesBaseQuery()
            ->published()
            ->search($filters['search'] ?? null)
            ->when(isset($filters['kategori_id']), fn ($query) => $query->where('kategori_id', $filters['kategori_id']))
            ->when(isset($filters['creator_id']), fn ($query) => $query->where('creator_id', $filters['creator_id']))
            ->when(isset($filters['featured']), fn ($query) => $query->where('is_featured', (bool) $filters['featured']))
            ->when($filters['genre'] ?? null, function ($query, string $slug) {
                $query->whereHas('genres', fn ($genreQuery) => $genreQuery->where('slug', $slug)->active());
            })
            ->when(isset($filters['genre_id']), function ($query) use ($filters) {
                $query->whereHas('genres', fn ($genreQuery) => $genreQuery->where('genres.genre_id', $filters['genre_id'])->active());
            })
            ->orderByDesc('is_featured')
            ->orderByDesc('published_at')
            ->orderBy('title')
            ->paginate($filters['per_page'] ?? 15)
            ->withQueryString();
    }

    public function findPublishedSeriesBySlug(string $slug): Series
    {
        return $this->seriesBaseQuery()
            ->with([
                'publishedEpisodes' => fn ($query) => $this->episodeStats($query),
            ])
            ->published()
            ->where('slug', $slug)
            ->firstOrFail();
    }

    public function findPublishedEpisode(int $episodeId, ?User $viewer = null): Episode
    {
        $episode = $this->episodeStats(
            Episode::query()
                ->with([
                    'series' => fn ($query) => $this->seriesBaseQuery($query)->published(),
                    'series.genres',
                    'series.category',
                    'series.creator',
                ])
                ->published()
                ->whereHas('series', fn ($query) => $query->published())
        )
            ->where('episode_id', $episodeId)
            ->firstOrFail();

        if ($viewer) {
            $progress = EpisodeProgress::query()
                ->where('user_id', $viewer->user_id)
                ->where('episode_id', $episode->episode_id)
                ->first();

            if ($progress) {
                $episode->setRelation('viewerProgress', $progress);
            }
        }

        return $episode;
    }

    public function recordEpisodeProgress(User $user, Episode $episode, array $payload): EpisodeProgress
    {
        $duration = (int) ($payload['duration_seconds'] ?? $episode->duration_seconds);
        $progress = (int) $payload['progress_seconds'];
        $percent = $duration > 0 ? min(100, round(($progress / $duration) * 100, 2)) : 0;
        $completed = (bool) ($payload['completed'] ?? ($duration > 0 && $percent >= 90));

        return DB::transaction(function () use ($user, $episode, $duration, $progress, $percent, $completed) {
            $record = EpisodeProgress::query()->updateOrCreate(
                [
                    'user_id' => $user->user_id,
                    'episode_id' => $episode->episode_id,
                ],
                [
                    'progress_seconds' => $progress,
                    'duration_seconds' => $duration,
                    'progress_percent' => $percent,
                    'completed_at' => $completed ? now() : null,
                    'last_watched_at' => now(),
                ]
            );

            return $record->load(['episode.series']);
        });
    }

    public function continueWatching(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return EpisodeProgress::query()
            ->with(['episode.series.genres', 'episode.series.category'])
            ->where('user_id', $user->user_id)
            ->whereHas('episode', fn ($query) => $query->published()->whereHas('series', fn ($seriesQuery) => $seriesQuery->published()))
            ->orderByDesc('last_watched_at')
            ->paginate($perPage);
    }

    public function paginateFavorites(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return Favorite::query()
            ->with([
                'favoritable' => function (MorphTo $morphTo) {
                    $morphTo->morphWith([
                        Series::class => ['genres', 'category', 'creator'],
                        Episode::class => ['series'],
                    ]);
                },
            ])
            ->where('user_id', $user->user_id)
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function favorite(User $user, array $payload): Favorite
    {
        $target = $this->resolvePublishedTarget($payload['target_type'], (int) $payload['target_id']);

        return Favorite::query()->firstOrCreate([
            'user_id' => $user->user_id,
            'favoritable_type' => $target::class,
            'favoritable_id' => $target->getKey(),
        ])->load('favoritable');
    }

    public function removeFavorite(User $user, int $favoriteId): void
    {
        $favorite = Favorite::query()
            ->where('user_id', $user->user_id)
            ->where('favorite_id', $favoriteId)
            ->firstOrFail();

        $favorite->delete();
    }

    public function rate(User $user, array $payload): Rating
    {
        $target = $this->resolvePublishedTarget($payload['target_type'], (int) $payload['target_id']);

        return Rating::query()->updateOrCreate(
            [
                'user_id' => $user->user_id,
                'rateable_type' => $target::class,
                'rateable_id' => $target->getKey(),
            ],
            [
                'score' => (int) $payload['score'],
                'review' => $payload['review'] ?? null,
                'status' => 'published',
            ]
        )->load('user');
    }

    protected function resolvePublishedTarget(string $type, int $id): Model
    {
        return match ($type) {
            'series' => Series::query()->published()->where('series_id', $id)->firstOrFail(),
            'episode' => Episode::query()
                ->published()
                ->whereHas('series', fn ($query) => $query->published())
                ->where('episode_id', $id)
                ->firstOrFail(),
            default => abort(422, 'Unsupported favorite or rating target.'),
        };
    }

    protected function seriesBaseQuery($query = null)
    {
        return ($query ?? Series::query())
            ->with(['creator', 'category', 'genres'])
            ->withCount([
                'publishedEpisodes',
                'favorites',
                'ratings' => fn ($ratingQuery) => $ratingQuery->where('status', 'published'),
            ])
            ->withAvg([
                'ratings as average_rating' => fn ($ratingQuery) => $ratingQuery->where('status', 'published'),
            ], 'score');
    }

    protected function episodeStats($query)
    {
        return $query
            ->withCount([
                'favorites',
                'ratings' => fn ($ratingQuery) => $ratingQuery->where('status', 'published'),
            ])
            ->withAvg([
                'ratings as average_rating' => fn ($ratingQuery) => $ratingQuery->where('status', 'published'),
            ], 'score');
    }
}

