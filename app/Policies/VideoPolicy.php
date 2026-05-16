<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Video;

class VideoPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(?User $user, Video $video): bool
    {
        if ($video->status === 'published' && ($video->visibility ?? 'public') === 'public') {
            return true;
        }

        return (bool) $user && ($user->isAdmin() || $user->user_id === $video->kreator_id);
    }

    public function create(User $user): bool
    {
        return $user->channel()->where('status', 'active')->exists();
    }

    public function update(User $user, Video $video): bool
    {
        return $user->user_id === $video->kreator_id;
    }

    public function delete(User $user, Video $video): bool
    {
        return $user->user_id === $video->kreator_id;
    }

    public function moderate(User $user, Video $video): bool
    {
        return $user->isAdmin();
    }
}
