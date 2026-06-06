'use client';

import type { Comment } from '@gr/shared';
import { useAuth, useUser } from '@clerk/nextjs';
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Divider,
  Group,
  Skeleton,
  Stack,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { IconCornerDownRight, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { useComments } from '@/api/hooks';

type CommentsSectionProps = {
  artworkId: string;
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString();
}

type CommentItemProps = {
  comment: Comment;
  artworkId: string;
  onDelete: (id: string) => void;
  currentUserId?: string;
  depth?: number;
};

function CommentItem({
  comment,
  artworkId,
  onDelete,
  currentUserId,
  depth = 0,
}: CommentItemProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const { isSignedIn } = useAuth();

  const {
    comments: replies,
    hasMore: hasMoreReplies,
    loadMore: loadMoreReplies,
    addComment: addReply,
    deleteComment: deleteReply,
    isLoading: loadingReplies,
  } = useComments(artworkId, comment.id, showReplies || showReply);

  const handlePostReply = async () => {
    if (!replyContent.trim()) {
      return;
    }
    await addReply(replyContent.trim());
    setReplyContent('');
    setShowReply(false);
    setShowReplies(true);
  };

  const isOwner = currentUserId === comment.user.id;

  return (
    <Box pl={depth > 0 ? 'md' : 0}>
      <Group align="flex-start" gap="sm" wrap="nowrap">
        <Avatar
          src={comment.user.avatar}
          size={36}
          radius="xl"
          style={{ flexShrink: 0 }}
        >
          {comment.user.username?.[0]?.toUpperCase() || 'U'}
        </Avatar>
        <Box flex={1} miw={0}>
          <Group gap="xs" mb={4}>
            <Text size="sm" fw={700}>
              {comment.user.displayName || comment.user.username}
            </Text>
            <Text size="xs" c="dimmed">
              {formatTimeAgo(comment.createdAt)}
            </Text>
          </Group>
          <Text size="sm" lh={1.5} mb="xs">
            {comment.content}
          </Text>
          <Group gap="xs">
            {isSignedIn && (
              <Button
                variant="subtle"
                size="compact-xs"
                onClick={() => setShowReply(!showReply)}
              >
                Reply
              </Button>
            )}
            {comment.replyCount > 0 && !showReplies && (
              <Button
                variant="subtle"
                size="compact-xs"
                leftSection={<IconCornerDownRight size={14} />}
                onClick={() => setShowReplies(true)}
              >
                {comment.replyCount}
                {' '}
                {comment.replyCount === 1 ? 'reply' : 'replies'}
              </Button>
            )}
            {isOwner && (
              <ActionIcon
                size="sm"
                variant="subtle"
                color="red"
                onClick={() => onDelete(comment.id)}
              >
                <IconTrash size={14} />
              </ActionIcon>
            )}
          </Group>

          {showReply && (
            <Group align="flex-start" gap="xs" mt="sm" wrap="nowrap">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                minRows={1}
                autosize
                radius="md"
                style={{ flex: 1 }}
                size="sm"
              />
              <Button size="xs" onClick={handlePostReply} disabled={!replyContent.trim()}>
                Post
              </Button>
            </Group>
          )}

          {showReplies && (
            <Stack gap="md" mt="md">
              {loadingReplies
                ? (
                    <>
                      <Skeleton h={40} />
                      <Skeleton h={40} />
                    </>
                  )
                : (
                    replies.map(reply => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        artworkId={artworkId}
                        onDelete={deleteReply}
                        currentUserId={currentUserId}
                        depth={depth + 1}
                      />
                    ))
                  )}
              {hasMoreReplies && (
                <Button variant="subtle" size="xs" onClick={loadMoreReplies}>
                  Load more replies
                </Button>
              )}
            </Stack>
          )}
        </Box>
      </Group>
    </Box>
  );
}

export function CommentsSection({ artworkId }: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('');
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const {
    comments,
    hasMore,
    loadMore,
    addComment,
    deleteComment,
    isLoading,
    total,
  } = useComments(artworkId);

  const handlePost = async () => {
    if (newComment.trim()) {
      await addComment(newComment.trim());
      setNewComment('');
    }
  };

  return (
    <Box>
      <Title order={4} mb="md">
        Comments (
        {total}
        )
      </Title>

      {isSignedIn
        ? (
            <Group align="flex-start" gap="sm" mb="lg" wrap="nowrap">
              <Avatar
                src={user?.imageUrl}
                size={36}
                radius="xl"
                style={{ flexShrink: 0 }}
              >
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                minRows={2}
                autosize
                radius="md"
                style={{ flex: 1 }}
              />
              <Button
                radius="md"
                disabled={!newComment.trim()}
                onClick={handlePost}
              >
                Post
              </Button>
            </Group>
          )
        : (
            <Text c="dimmed" mb="lg">
              Sign in to leave a comment
            </Text>
          )}

      <Divider mb="lg" />

      {isLoading
        ? (
            <Stack gap="md">
              <Skeleton h={60} />
              <Skeleton h={60} />
              <Skeleton h={60} />
            </Stack>
          )
        : comments.length === 0
          ? (
              <Text c="dimmed" ta="center" py="lg">
                No comments yet. Be the first to comment!
              </Text>
            )
          : (
              <Stack gap="lg">
                {comments.map(comment => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    artworkId={artworkId}
                    onDelete={deleteComment}
                    currentUserId={user?.id}
                  />
                ))}
              </Stack>
            )}

      {hasMore && (
        <Button
          variant="subtle"
          fullWidth
          mt="lg"
          onClick={loadMore}
        >
          Load more comments
        </Button>
      )}
    </Box>
  );
}
