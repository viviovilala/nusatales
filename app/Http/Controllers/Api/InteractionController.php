<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Interaction\StoreCommentRequest;
use App\Http\Requests\Interaction\StoreShareRequest;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Services\InteractionService;
use App\Services\VideoService;
use Illuminate\Http\Request;

class InteractionController extends Controller
{
    public function __construct(
        protected InteractionService $interactionService,
        protected VideoService $videoService
    ) {
    }

    public function like(Request $request, int $video)
    {
        $record = $this->videoService->findPublishedVideoOrFail($video);
        $result = $this->interactionService->toggleLike($request->user(), $record);

        return $this->successResponse('Like state updated successfully.', $result);
    }

    public function comments(Request $request, int $video)
    {
        $record = $this->videoService->findPublishedVideoOrFail($video);
        $paginator = $this->interactionService->paginateComments($record, (int) $request->integer('per_page', 15));

        return $this->paginatedResponse(
            'Comments retrieved successfully.',
            $paginator,
            CommentResource::collection($paginator)
        );
    }

    public function storeComment(StoreCommentRequest $request, int $video)
    {
        $record = $this->videoService->findPublishedVideoOrFail($video);
        $comment = $this->interactionService->addComment($request->user(), $record, $request->validated()['content']);

        return $this->successResponse('Comment added successfully.', new CommentResource($comment), 201);
    }

    public function destroyComment(Request $request, Comment $comment)
    {
        $this->interactionService->deleteComment($request->user(), $comment);

        return $this->successResponse('Comment deleted successfully.', null);
    }

    public function share(StoreShareRequest $request, int $video)
    {
        $record = $this->videoService->findPublishedVideoOrFail($video);
        $share = $this->interactionService->recordShare(
            $request->user(),
            $record,
            $request->validated()['platform_share']
        );

        return $this->successResponse('Share recorded successfully.', [
            'id' => $share->share_id,
            'platform' => $share->platform_share,
        ], 201);
    }

    public function view(int $video)
    {
        $record = $this->videoService->findPublishedVideoOrFail($video);
        $this->interactionService->incrementView($record);

        return $this->successResponse('View recorded successfully.', null);
    }
}
