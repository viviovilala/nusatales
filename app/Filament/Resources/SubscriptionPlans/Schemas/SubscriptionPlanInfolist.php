<?php

namespace App\Filament\Resources\SubscriptionPlans\Schemas;

use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class SubscriptionPlanInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('name'),
                TextEntry::make('description')
                    ->placeholder('-')
                    ->columnSpanFull(),
                TextEntry::make('price')
                    ->money(),
                TextEntry::make('duration_days')
                    ->numeric(),
                TextEntry::make('status')
                    ->badge(),
            ]);
    }
}
