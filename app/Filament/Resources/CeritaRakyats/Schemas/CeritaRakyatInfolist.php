<?php

namespace App\Filament\Resources\CeritaRakyats\Schemas;

use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class CeritaRakyatInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('judul_cerita'),
                TextEntry::make('asal_daerah'),
                TextEntry::make('deskripsi')
                    ->placeholder('-')
                    ->columnSpanFull(),
                TextEntry::make('pesan_moral')
                    ->placeholder('-')
                    ->columnSpanFull(),
                TextEntry::make('sumber')
                    ->placeholder('-'),
                TextEntry::make('lokasi_id')
                    ->numeric()
                    ->placeholder('-'),
            ]);
    }
}
