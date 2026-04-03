<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['nama', 'email', 'password', 'foto_profil', 'tanggal_daftar', 'role'])]
#[Hidden(['password'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $primaryKey = 'user_id';

    public $timestamps = false;

    protected $table = 'users';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tanggal_daftar' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'user_id';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isCreator(): bool
    {
        return in_array($this->role, ['kreator', 'admin'], true);
    }

    public function videos(): HasMany
    {
        return $this->hasMany(Video::class, 'kreator_id', 'user_id');
    }

    public function likes(): HasMany
    {
        return $this->hasMany(Like::class, 'user_id', 'user_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class, 'user_id', 'user_id');
    }

    public function shares(): HasMany
    {
        return $this->hasMany(Share::class, 'user_id', 'user_id');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class, 'user_id', 'user_id');
    }

    public function points(): HasOne
    {
        return $this->hasOne(UserPoint::class, 'user_id', 'user_id');
    }

    public function earnings(): HasMany
    {
        return $this->hasMany(Earning::class, 'kreator_id', 'user_id');
    }

    public function following(): HasMany
    {
        return $this->hasMany(Follow::class, 'user_id', 'user_id');
    }

    public function followers(): HasMany
    {
        return $this->hasMany(Follow::class, 'kreator_id', 'user_id');
    }

    public function watchHistory(): HasMany
    {
        return $this->hasMany(WatchHistory::class, 'user_id', 'user_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(UserSubscription::class, 'user_id', 'user_id');
    }

    public function nusaKoinTransactions(): HasMany
    {
        return $this->hasMany(NusaKoinTransaction::class, 'user_id', 'user_id');
    }

    public function userMissions(): HasMany
    {
        return $this->hasMany(UserMission::class, 'user_id', 'user_id');
    }
}
