'use client';

import type { Comment } from '@/mocks/artworkDetailData';
import {
  Avatar,
  Box,
  Button,
  Divider,
  Group,
  Stack,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { useState } from 'react';

type CommentsSectionProps = {
  comments: Comment[];
  totalCount: number;
};

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <Group align="flex-start" gap="sm" wrap="nowrap">
      <Avatar
        src={comment.author.avatar}
        size={36}
        radius="xl"
        style={{ flexShrink: 0 }}
      />
      <Box flex={1} miw={0}>
        <Group gap="xs" mb={4}>
          <Text size="sm" fw={700}>
            {comment.author.name}
          </Text>
          <Text size="xs" c="dimmed">
            {comment.timeAgo}
          </Text>
        </Group>
        <Text size="sm" lh={1.5}>
          {comment.content}
        </Text>
      </Box>
    </Group>
  );
}

export function CommentsSection({ comments, totalCount }: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('');

  const handlePost = () => {
    if (newComment.trim()) {
      // TODO: Implement post comment
      setNewComment('');
    }
  };

  return (
    <Box>
      <Title order={4} mb="md">
        Comments (
        {totalCount}
        )
      </Title>

      {/* Comment Input */}
      <Group align="flex-start" gap="sm" mb="lg" wrap="nowrap">
        <Avatar
          size={36}
          radius="xl"
          style={{ flexShrink: 0 }}
        >
          U
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

      <Divider mb="lg" />

      {/* Comments List */}
      <Stack gap="lg">
        {comments.map(comment => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </Stack>

      {/* View All */}
      {totalCount > comments.length && (
        <Button
          variant="subtle"
          fullWidth
          mt="lg"
        >
          View all
          {' '}
          {totalCount}
          {' '}
          comments
        </Button>
      )}
    </Box>
  );
}
