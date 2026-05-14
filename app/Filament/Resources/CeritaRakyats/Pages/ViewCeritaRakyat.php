<?php

namespace App\Filament\Resources\CeritaRakyats\Pages;

use App\Filament\Resources\CeritaRakyats\CeritaRakyatResource;
use Filament\Actions\EditAction;
use Filament\Resources\Pages\ViewRecord;

class ViewCeritaRakyat extends ViewRecord
{
    protected static string $resource = CeritaRakyatResource::class;

    protected function getHeaderActions(): array
    {
        return [
            EditAction::make(),
        ];
    }
}
