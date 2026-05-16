<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\ChannelResource;
use App\Http\Resources\KategoriResource;
use App\Http\Resources\RegionResource;
use App\Http\Resources\SeriesResource;
use App\Http\Resources\VideoResource;
use App\Models\Channel;
use App\Models\Kategori;
use App\Models\Region;
use App\Models\Series;
use App\Models\Video;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function categories()
    {
        $categories = Kategori::query()
            ->when(Kategori::query()->whereNotNull('status')->exists(), fn ($query) => $query->where('status', 'active'))
            ->orderBy('nama_kategori')
            ->get();

        return $this->successResponse('Categories retrieved successfully.', KategoriResource::collection($categories)->resolve());
    }

    public function regions()
    {
        $regions = Region::query()->orderBy('name')->get();

        return $this->successResponse('Regions retrieved successfully.', RegionResource::collection($regions)->resolve());
    }

    public function regionSeries(string $slug)
    {
        $region = Region::query()->where('slug', $slug)->firstOrFail();
        $series = Series::query()
            ->with(['creator', 'category', 'genres'])
            ->where('status', 'published')
            ->whereHas('creator.videos', fn ($query) => $query
                ->published()
                ->publiclyVisible()
                ->where('region_id', $region->id))
            ->limit(24)
            ->get();

        return $this->successResponse('Region series retrieved successfully.', [
            'region' => new RegionResource($region),
            'series' => SeriesResource::collection($series)->resolve(),
        ]);
    }

    public function search(Request $request)
    {
        $keyword = trim((string) $request->query('q', $request->query('keyword', '')));

        if ($keyword === '') {
            return $this->successResponse('Search results retrieved successfully.', [
                'videos' => [],
                'series' => [],
                'channels' => [],
            ]);
        }

        $videos = Video::query()
            ->with(['creator.channel', 'channel', 'category', 'genres', 'region', 'analytics'])
            ->withCount(['likes', 'comments', 'shares'])
            ->published()
            ->publiclyVisible()
            ->search($keyword)
            ->limit(12)
            ->get();

        $series = Series::query()
            ->with(['creator', 'category', 'genres'])
            ->published()
            ->search($keyword)
            ->limit(12)
            ->get();

        $channels = Channel::query()
            ->with('user')
            ->where('status', 'active')
            ->where('name', 'like', "%{$keyword}%")
            ->limit(8)
            ->get();

        return $this->successResponse('Search results retrieved successfully.', [
            'videos' => VideoResource::collection($videos)->resolve(),
            'series' => SeriesResource::collection($series)->resolve(),
            'channels' => ChannelResource::collection($channels)->resolve(),
        ]);
    }
}
