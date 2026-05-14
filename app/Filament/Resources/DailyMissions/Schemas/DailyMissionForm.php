<?php

namespace App\Filament\Resources\DailyMissions\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class DailyMissionForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('judul')
                    ->required(),
                Textarea::make('deskripsi')
                    ->columnSpanFull(),
                TextInput::make('target')
                    ->required()
                    ->numeric(),
                Select::make('tipe')
                    ->options(['watch' => 'Watch', 'like' => 'Like', 'comment' => 'Comment'])
                    ->required(),
                TextInput::make('reward_point')
                    ->required()
                    ->numeric(),
            ]);
    }
}
