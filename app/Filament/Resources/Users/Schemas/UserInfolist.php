<?php

namespace App\Filament\Resources\Users\Schemas;

use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class UserInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('nama'),
                TextEntry::make('email')
                    ->label('Email address'),
                TextEntry::make('foto_profil')
                    ->placeholder('-'),
                TextEntry::make('tanggal_daftar')
                    ->dateTime(),
                TextEntry::make('role')
                    ->badge(),
            ]);
    }
}
