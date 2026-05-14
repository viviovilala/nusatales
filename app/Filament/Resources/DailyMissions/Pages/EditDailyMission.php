<?php

namespace App\Filament\Resources\DailyMissions\Pages;

use App\Filament\Resources\DailyMissions\DailyMissionResource;
use Filament\Actions\DeleteAction;
use Filament\Actions\ViewAction;
use Filament\Resources\Pages\EditRecord;

class EditDailyMission extends EditRecord
{
    protected static string $resource = DailyMissionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            ViewAction::make(),
            DeleteAction::make(),
        ];
    }
}
