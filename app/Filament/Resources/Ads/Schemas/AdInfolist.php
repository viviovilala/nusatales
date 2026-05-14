<?php

namespace App\Filament\Resources\Ads\Schemas;

use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class AdInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('nama_brand'),
                TextEntry::make('jenis_iklan'),
                TextEntry::make('durasi')
                    ->numeric(),
                TextEntry::make('video.video_id')
                    ->label('Video')
                    ->placeholder('-'),
            ]);
    }
}
