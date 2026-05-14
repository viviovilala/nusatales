<?php

namespace App\Filament\Pages\Auth;

use Filament\Auth\Pages\Register;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Component;

class AdminRegister extends Register
{
    protected function getNameFormComponent(): Component
    {
        return TextInput::make('nama')
            ->label('Name')
            ->required()
            ->maxLength(255)
            ->autofocus();
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function mutateFormDataBeforeRegister(array $data): array
    {
        return [
            ...$data,
            'role' => 'admin',
            'tanggal_daftar' => now(),
        ];
    }
}
