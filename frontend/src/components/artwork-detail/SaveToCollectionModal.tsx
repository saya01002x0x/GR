'use client';

import type { Collection } from '@gr/shared';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { IconFolder, IconLock, IconPlus, IconWorld } from '@tabler/icons-react';
import { useState } from 'react';
import { useArtworkCollections, useCollections } from '@/api/hooks';

type SaveToCollectionModalProps = {
  artworkId: string;
  opened: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export function SaveToCollectionModal({
  artworkId,
  opened,
  onClose,
  onSaved,
}: SaveToCollectionModalProps) {
  const { collections, isLoading, createCollection } = useCollections();
  const { toggleCollection } = useArtworkCollections(artworkId);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleToggle = (collectionId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId);
      } else {
        newSet.add(collectionId);
      }
      return newSet;
    });
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      return;
    }

    const response = await createCollection({ name: newName.trim(), isPrivate });
    if (response?.data) {
      setSelectedIds(prev => new Set(prev).add(response.data.id));
      setNewName('');
      setShowCreateForm(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const collectionId of selectedIds) {
        await toggleCollection({ collectionId, isCurrentlyInCollection: false });
      }
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Save to Collection"
      size="sm"
      centered
    >
      {isLoading
        ? (
            <Box py="xl" ta="center">
              <Loader size="sm" />
            </Box>
          )
        : (
            <Stack gap="md">
              {collections.map((collection: Collection) => (
                <Group
                  key={collection.id}
                  justify="space-between"
                  p="xs"
                  style={{
                    borderRadius: 8,
                    cursor: 'pointer',
                    backgroundColor: selectedIds.has(collection.id)
                      ? 'var(--mantine-color-primary-light)'
                      : 'transparent',
                  }}
                  onClick={() => handleToggle(collection.id)}
                >
                  <Group gap="sm">
                    <IconFolder size={20} />
                    <Box>
                      <Text size="sm" fw={500}>
                        {collection.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {collection.artworkCount}
                        {' '}
                        artworks
                      </Text>
                    </Box>
                  </Group>
                  <Group gap="xs">
                    {collection.isPrivate
                      ? (
                          <IconLock size={14} color="var(--mantine-color-dimmed)" />
                        )
                      : (
                          <IconWorld size={14} color="var(--mantine-color-dimmed)" />
                        )}
                    <Checkbox
                      checked={selectedIds.has(collection.id)}
                      onChange={() => handleToggle(collection.id)}
                      onClick={e => e.stopPropagation()}
                    />
                  </Group>
                </Group>
              ))}

              <Divider />

              {showCreateForm
                ? (
                    <Stack gap="sm">
                      <TextInput
                        placeholder="Collection name"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                      />
                      <Group gap="xs">
                        <Checkbox
                          label="Private"
                          checked={isPrivate}
                          onChange={e => setIsPrivate(e.currentTarget.checked)}
                        />
                      </Group>
                      <Group gap="xs">
                        <Button variant="default" size="sm" onClick={() => setShowCreateForm(false)}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>
                          Create
                        </Button>
                      </Group>
                    </Stack>
                  )
                : (
                    <Button
                      variant="subtle"
                      leftSection={<IconPlus size={16} />}
                      onClick={() => setShowCreateForm(true)}
                    >
                      Create new collection
                    </Button>
                  )}

              <Divider />

              <Button
                fullWidth
                onClick={handleSave}
                loading={saving}
                disabled={selectedIds.size === 0}
              >
                Save to
                {' '}
                {selectedIds.size}
                {' '}
                collection
                {selectedIds.size !== 1 ? 's' : ''}
              </Button>
            </Stack>
          )}
    </Modal>
  );
}
