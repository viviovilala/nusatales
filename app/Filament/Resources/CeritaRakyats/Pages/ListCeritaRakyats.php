<?php

namespace App\Filament\Resources\CeritaRakyats\Pages;

use App\Filament\Resources\CeritaRakyats\CeritaRakyatResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListCeritaRakyats extends ListRecords
{
    protected static string $resource = CeritaRakyatResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
