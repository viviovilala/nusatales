<?php

namespace App\Filament\Resources\SubscriptionPlans;

use App\Filament\Resources\SubscriptionPlans\Pages\CreateSubscriptionPlan;
use App\Filament\Resources\SubscriptionPlans\Pages\EditSubscriptionPlan;
use App\Filament\Resources\SubscriptionPlans\Pages\ListSubscriptionPlans;
use App\Filament\Resources\SubscriptionPlans\Pages\ViewSubscriptionPlan;
use App\Filament\Resources\SubscriptionPlans\Schemas\SubscriptionPlanForm;
use App\Filament\Resources\SubscriptionPlans\Schemas\SubscriptionPlanInfolist;
use App\Filament\Resources\SubscriptionPlans\Tables\SubscriptionPlansTable;
use App\Models\SubscriptionPlan;
use BackedEnum;
use UnitEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class SubscriptionPlanResource extends Resource
{
    protected static ?string $model = SubscriptionPlan::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    protected static ?string $navigationLabel = 'Subscription Plans';

    protected static string|UnitEnum|null $navigationGroup = 'Monetization';

    public static function form(Schema $schema): Schema
    {
        return SubscriptionPlanForm::configure($schema);
    }

    public static function infolist(Schema $schema): Schema
    {
        return SubscriptionPlanInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return SubscriptionPlansTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListSubscriptionPlans::route('/'),
            'create' => CreateSubscriptionPlan::route('/create'),
            'view' => ViewSubscriptionPlan::route('/{record}'),
            'edit' => EditSubscriptionPlan::route('/{record}/edit'),
        ];
    }
}
