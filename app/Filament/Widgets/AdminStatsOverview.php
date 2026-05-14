<?php

namespace App\Filament\Widgets;

use App\Models\Analytics;
use App\Models\User;
use App\Models\Video;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class AdminStatsOverview extends BaseWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('Total Users', User::count()),
            Stat::make('Creators', User::where('role', 'creator')->count()),
            Stat::make('Animations', Video::count()),
            Stat::make('Published', Video::where('status', 'published')->count()),
            Stat::make('Pending Drafts', Video::where('status', 'draft')->count()),
            Stat::make('Total Views', (int) Analytics::sum('views')),
        ];
    }
}
