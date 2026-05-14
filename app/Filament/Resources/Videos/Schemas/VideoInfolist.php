<?php

namespace App\Filament\Resources\Videos\Schemas;

use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class VideoInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('judul'),
                TextEntry::make('deskripsi')
                    ->placeholder('-')
                    ->columnSpanFull(),
                TextEntry::make('durasi')
                    ->numeric(),
                TextEntry::make('url_video'),
                TextEntry::make('thumbnail')
                    ->placeholder('-'),
                TextEntry::make('status')
                    ->badge(),
                TextEntry::make('rejection_reason')
                    ->placeholder('-')
                    ->columnSpanFull(),
                TextEntry::make('tanggal_upload')
                    ->dateTime(),
                TextEntry::make('kreator_id')
                    ->numeric(),
                TextEntry::make('kategori_id')
                    ->numeric()
                    ->placeholder('-'),
                TextEntry::make('cerita_id')
                    ->numeric()
                    ->placeholder('-'),
            ]);
    }
}
