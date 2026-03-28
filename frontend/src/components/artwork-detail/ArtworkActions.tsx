'use client';

import {
  ActionIcon,
  Button,
  Group,
} from '@mantine/core';
import {
  IconBookmark,
  IconBookmarkFilled,
  IconDots,
  IconHeart,
  IconHeartFilled,
  IconShare,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useLike } from '@/hooks';
import { SaveToCollectionModal } from './SaveToCollectionModal';

type ArtworkActionsProps = {
  artworkId: string;
  initialLikeCount?: number;
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
}

export function ArtworkActions({
  artworkId,
  initialLikeCount = 0,
}: ArtworkActionsProps) {
  const { liked, likeCount, toggleLike } = useLike(artworkId);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: document.title,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <>
      <Group gap="sm" mb="xl">
        {/* Like Button with Count */}
        <Button
          variant={liked ? 'filled' : 'default'}
          color={liked ? 'red' : 'gray'}
          size="md"
          radius="md"
          leftSection={liked ? <IconHeartFilled size={18} /> : <IconHeart size={18} />}
          onClick={toggleLike}
          styles={{
            root: {
              transition: 'all 0.2s ease',
              transform: liked ? 'scale(1.05)' : 'scale(1)',
            },
          }}
        >
          {formatNumber(likeCount || initialLikeCount)}
        </Button>

        {/* Save Button */}
        <ActionIcon
          variant={isSaved ? 'filled' : 'default'}
          color={isSaved ? 'primary' : 'gray'}
          size="lg"
          radius="md"
          onClick={() => setSaveModalOpen(true)}
        >
          {isSaved ? <IconBookmarkFilled size={20} /> : <IconBookmark size={20} />}
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

      {/* Save to Collection Modal */}
      <SaveToCollectionModal
        artworkId={artworkId}
        opened={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSaved={() => setIsSaved(true)}
      />
    </>
  );
}
