<?php

namespace App\Filament\Resources\CeritaRakyats;

use App\Filament\Resources\CeritaRakyats\Pages\CreateCeritaRakyat;
use App\Filament\Resources\CeritaRakyats\Pages\EditCeritaRakyat;
use App\Filament\Resources\CeritaRakyats\Pages\ListCeritaRakyats;
use App\Filament\Resources\CeritaRakyats\Pages\ViewCeritaRakyat;
use App\Filament\Resources\CeritaRakyats\Schemas\CeritaRakyatForm;
use App\Filament\Resources\CeritaRakyats\Schemas\CeritaRakyatInfolist;
use App\Filament\Resources\CeritaRakyats\Tables\CeritaRakyatsTable;
use App\Models\CeritaRakyat;
use BackedEnum;
use UnitEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class CeritaRakyatResource extends Resource
{
    protected static ?string $model = CeritaRakyat::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    protected static ?string $navigationLabel = 'Folk Stories';

    protected static string|UnitEnum|null $navigationGroup = 'References';

    public static function form(Schema $schema): Schema
    {
        return CeritaRakyatForm::configure($schema);
    }

    public static function infolist(Schema $schema): Schema
    {
        return CeritaRakyatInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return CeritaRakyatsTable::configure($table);
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
            'index' => ListCeritaRakyats::route('/'),
            'create' => CreateCeritaRakyat::route('/create'),
            'view' => ViewCeritaRakyat::route('/{record}'),
            'edit' => EditCeritaRakyat::route('/{record}/edit'),
        ];
    }
}
