<?php

namespace App\Filament\Resources\CeritaRakyats\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class CeritaRakyatForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('judul_cerita')
                    ->required(),
                TextInput::make('asal_daerah')
                    ->required(),
                Textarea::make('deskripsi')
                    ->columnSpanFull(),
                Textarea::make('pesan_moral')
                    ->columnSpanFull(),
                TextInput::make('sumber'),
                TextInput::make('lokasi_id')
                    ->numeric(),
            ]);
    }
}
