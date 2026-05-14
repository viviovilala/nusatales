<?php

namespace App\Filament\Resources\DailyMissions\Pages;

use App\Filament\Resources\DailyMissions\DailyMissionResource;
use Filament\Actions\EditAction;
use Filament\Resources\Pages\ViewRecord;

class ViewDailyMission extends ViewRecord
{
    protected static string $resource = DailyMissionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            EditAction::make(),
        ];
    }
}
