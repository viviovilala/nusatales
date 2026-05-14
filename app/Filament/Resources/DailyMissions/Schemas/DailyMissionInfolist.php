<?php

namespace App\Filament\Resources\DailyMissions\Schemas;

use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class DailyMissionInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('judul'),
                TextEntry::make('deskripsi')
                    ->placeholder('-')
                    ->columnSpanFull(),
                TextEntry::make('target')
                    ->numeric(),
                TextEntry::make('tipe')
                    ->badge(),
                TextEntry::make('reward_point')
                    ->numeric(),
            ]);
    }
}
