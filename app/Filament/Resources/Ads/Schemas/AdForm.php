<?php

namespace App\Filament\Resources\Ads\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class AdForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('nama_brand')
                    ->required(),
                TextInput::make('jenis_iklan')
                    ->required(),
                TextInput::make('durasi')
                    ->required()
                    ->numeric(),
                Select::make('video_id')
                    ->relationship('video', 'judul')
                    ->searchable()
                    ->preload(),
            ]);
    }
}
