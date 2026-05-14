<?php

namespace App\Filament\Resources\DailyMissions\Pages;

use App\Filament\Resources\DailyMissions\DailyMissionResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListDailyMissions extends ListRecords
{
    protected static string $resource = DailyMissionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
