<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlatformController extends Controller
{
    public function coinPackages()
    {
        $items = DB::table('coin_packages')
            ->where('is_active', true)
            ->orderBy('price')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'code' => $item->code,
                'coins' => $item->coins + $item->bonus_coins,
                'bonus' => $item->bonus_coins,
                'price' => $item->price,
                'priceLabel' => 'Rp'.number_format($item->price, 0, ',', '.'),
            ]);

        return $this->successResponse('Coin packages retrieved successfully.', $items);
    }

    public function checkoutCoinPackage(int $package)
    {
        return $this->successResponse('Coin package checkout created.', [
            'snap_token' => null,
            'package_id' => $package,
            'mode' => 'demo',
        ], 201);
    }

    public function assets(Request $request)
    {
        $items = DB::table('assets')
            ->where('is_active', true)
            ->when($request->query('category'), fn ($query, $category) => $query->where('category', $category))
            ->orderBy('title')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'title' => $item->title,
                'slug' => $item->slug,
                'category' => $item->category,
                'description' => $item->description,
                'coin_price' => $item->coin_price,
                'price' => "{$item->coin_price} NusaKoin",
                'preview_url' => $item->preview_path ? asset('storage/'.$item->preview_path) : '/assets/nusatales/fallback-thumbnail.svg',
            ]);

        return $this->successResponse('Assets retrieved successfully.', $items);
    }

    public function asset(string $slug)
    {
        $item = DB::table('assets')->where('slug', $slug)->first();

        abort_unless($item, 404);

        return $this->successResponse('Asset retrieved successfully.', [
            'id' => $item->id,
            'title' => $item->title,
            'slug' => $item->slug,
            'category' => $item->category,
            'description' => $item->description,
            'coin_price' => $item->coin_price,
            'price' => "{$item->coin_price} NusaKoin",
            'preview_url' => $item->preview_path ? asset('storage/'.$item->preview_path) : '/assets/nusatales/fallback-thumbnail.svg',
        ]);
    }

    public function challenges()
    {
        $items = DB::table('challenges')
            ->orderByDesc('starts_at')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'title' => $item->title,
                'slug' => $item->slug,
                'description' => $item->description,
                'status' => $item->status,
                'starts_at' => $item->starts_at,
                'ends_at' => $item->ends_at,
                'rewards' => json_decode($item->rewards ?? '[]', true),
            ]);

        return $this->successResponse('Challenges retrieved successfully.', $items);
    }

    public function challenge(string $slug)
    {
        $item = DB::table('challenges')->where('slug', $slug)->first();

        abort_unless($item, 404);

        return $this->successResponse('Challenge retrieved successfully.', [
            'id' => $item->id,
            'title' => $item->title,
            'slug' => $item->slug,
            'description' => $item->description,
            'status' => $item->status,
            'starts_at' => $item->starts_at,
            'ends_at' => $item->ends_at,
            'rewards' => json_decode($item->rewards ?? '[]', true),
            'leaderboard' => [
                ['rank' => 1, 'name' => 'Maya Kertanegara', 'work' => 'Ksatria Gatotkaca Cyberpunk', 'votes' => '2.4k'],
                ['rank' => 2, 'name' => 'Budi Satria', 'work' => 'Srikandi sang Archery-Tech', 'votes' => '1.8k'],
                ['rank' => 3, 'name' => 'Lala Indah', 'work' => 'Semar dalam Dimensi Digital', 'votes' => '1.5k'],
            ],
        ]);
    }

    public function challengeLeaderboard(int $challenge)
    {
        return $this->successResponse('Challenge leaderboard retrieved successfully.', [
            ['rank' => 1, 'name' => 'Maya Kertanegara', 'work' => 'Ksatria Gatotkaca Cyberpunk', 'votes' => '2.4k'],
            ['rank' => 2, 'name' => 'Budi Satria', 'work' => 'Srikandi sang Archery-Tech', 'votes' => '1.8k'],
            ['rank' => 3, 'name' => 'Lala Indah', 'work' => 'Semar dalam Dimensi Digital', 'votes' => '1.5k'],
        ]);
    }

    public function culturalProgress(Request $request)
    {
        $userId = $request->user()?->user_id;
        $record = $userId ? DB::table('cultural_progress')->where('user_id', $userId)->first() : null;

        return $this->successResponse('Cultural progress retrieved successfully.', [
            'points' => $record?->points ?? 450,
            'level' => $record?->level ?? 3,
            'stage' => $record?->stage ?? 'Jalur Raja',
            'knowledge' => $record ? json_decode($record->knowledge ?? '[]', true) : [],
        ]);
    }

    public function badges()
    {
        return $this->successResponse('Badges retrieved successfully.', DB::table('badges')->orderBy('name')->get());
    }

    public function billing()
    {
        return $this->successResponse('Billing retrieved successfully.', []);
    }
}
