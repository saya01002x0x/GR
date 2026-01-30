'use client';

import {
  ActionIcon,
  Button,
  Group,
} from '@mantine/core';
import {
  IconBookmark,
  IconDots,
  IconHeart,
  IconHeartFilled,
  IconShare,
} from '@tabler/icons-react';
import { useState } from 'react';
import { formatNumber } from '@/mocks/artworkDetailData';

type ArtworkActionsProps = {
  likes: number;
  initialLiked?: boolean;
  initialSaved?: boolean;
};

export function ArtworkActions({
  likes,
  initialLiked = false,
  initialSaved = false,
}: ArtworkActionsProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [saved, setSaved] = useState(initialSaved);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => (liked ? prev - 1 : prev + 1));
  };

  const handleSave = () => {
    setSaved(!saved);
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: document.title,
        url: window.location.href,
      });
    }
  };

  return (
    <Group gap="sm" mb="xl">
      {/* Like Button with Count */}
      <Button
        variant={liked ? 'filled' : 'default'}
        color={liked ? 'red' : 'gray'}
        size="md"
        radius="md"
        leftSection={liked ? <IconHeartFilled size={18} /> : <IconHeart size={18} />}
        onClick={handleLike}
      >
        {formatNumber(likeCount)}
      </Button>

      {/* Save Button */}
      <ActionIcon
        variant={saved ? 'filled' : 'default'}
        color={saved ? 'primary' : 'gray'}
        size="lg"
        radius="md"
        onClick={handleSave}
      >
        <IconBookmark size={20} />
      </ActionIcon>

      {/* Share Button */}
      <ActionIcon
        variant="default"
        size="lg"
        radius="md"
        onClick={handleShare}
      >
        <IconShare size={20} />
      </ActionIcon>

      {/* More Options */}
      <ActionIcon
        variant="default"
        size="lg"
        radius="md"
      >
        <IconDots size={20} />
      </ActionIcon>
    </Group>
  );
}
