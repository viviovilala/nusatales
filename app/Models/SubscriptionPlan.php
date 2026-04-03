<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    protected $table = 'subscription_plans';

    protected $primaryKey = 'plan_id';

    public $timestamps = false;

    protected $fillable = [
        'name',
        'description',
        'price',
        'duration_days',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'plan_id';
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(UserSubscription::class, 'plan_id', 'plan_id');
    }
}
