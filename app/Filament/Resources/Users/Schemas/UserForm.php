<?php

namespace App\Filament\Resources\Users\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class UserForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('nama')
                    ->required(),
                TextInput::make('email')
                    ->label('Email address')
                    ->email()
                    ->required(),
                TextInput::make('password')
                    ->password()
                    ->required(fn (string $operation): bool => $operation === 'create')
                    ->dehydrated(fn (?string $state): bool => filled($state)),
                FileUpload::make('foto_profil')
                    ->label('Profile photo')
                    ->disk('public')
                    ->directory('profiles')
                    ->image()
                    ->imageEditor(),
                DateTimePicker::make('tanggal_daftar')
                    ->default(now())
                    ->required(),
                Select::make('role')
                    ->options(['user' => 'User', 'creator' => 'Creator', 'admin' => 'Admin'])
                    ->default('user')
                    ->required(),
            ]);
    }
}
