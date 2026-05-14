<?php

namespace App\Filament\Resources\DailyMissions;

use App\Filament\Resources\DailyMissions\Pages\CreateDailyMission;
use App\Filament\Resources\DailyMissions\Pages\EditDailyMission;
use App\Filament\Resources\DailyMissions\Pages\ListDailyMissions;
use App\Filament\Resources\DailyMissions\Pages\ViewDailyMission;
use App\Filament\Resources\DailyMissions\Schemas\DailyMissionForm;
use App\Filament\Resources\DailyMissions\Schemas\DailyMissionInfolist;
use App\Filament\Resources\DailyMissions\Tables\DailyMissionsTable;
use App\Models\DailyMission;
use BackedEnum;
use UnitEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class DailyMissionResource extends Resource
{
    protected static ?string $model = DailyMission::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    protected static ?string $navigationLabel = 'Daily Missions';

    protected static string|UnitEnum|null $navigationGroup = 'Engagement';

    public static function form(Schema $schema): Schema
    {
        return DailyMissionForm::configure($schema);
    }

    public static function infolist(Schema $schema): Schema
    {
        return DailyMissionInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return DailyMissionsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListDailyMissions::route('/'),
            'create' => CreateDailyMission::route('/create'),
            'view' => ViewDailyMission::route('/{record}'),
            'edit' => EditDailyMission::route('/{record}/edit'),
        ];
    }
}
