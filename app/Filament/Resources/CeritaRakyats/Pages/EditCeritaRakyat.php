<?php

namespace App\Filament\Resources\CeritaRakyats\Pages;

use App\Filament\Resources\CeritaRakyats\CeritaRakyatResource;
use Filament\Actions\DeleteAction;
use Filament\Actions\ViewAction;
use Filament\Resources\Pages\EditRecord;

class EditCeritaRakyat extends EditRecord
{
    protected static string $resource = CeritaRakyatResource::class;

    protected function getHeaderActions(): array
    {
        return [
            ViewAction::make(),
            DeleteAction::make(),
        ];
    }
}
