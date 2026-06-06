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
import { useMemo, useState } from 'react';
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
  const {
    collectionIds,
    isLoading: isLoadingArtworkCollections,
    toggleCollection,
  } = useArtworkCollections(artworkId);

  const [draftSelection, setDraftSelection] = useState<{
    baseKey: string;
    ids: Set<string>;
  }>(() => ({ baseKey: '', ids: new Set() }));
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [saving, setSaving] = useState(false);
  const savedKey = useMemo(() => collectionIds.join('\0'), [collectionIds]);
  const savedIds = useMemo<Set<string>>(() => new Set(collectionIds), [collectionIds]);
  const selectedIds = draftSelection.baseKey === savedKey
    ? draftSelection.ids
    : savedIds;
  const hasChanges = useMemo(() => {
    if (selectedIds.size !== savedIds.size) {
      return true;
    }
    for (const id of selectedIds) {
      if (!savedIds.has(id)) {
        return true;
      }
    }
    return false;
  }, [savedIds, selectedIds]);

  const handleToggle = (collectionId: string) => {
    setDraftSelection((prev) => {
      const currentIds = prev.baseKey === savedKey ? prev.ids : savedIds;
      const newSet = new Set(currentIds);
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId);
      } else {
        newSet.add(collectionId);
      }
      return { baseKey: savedKey, ids: newSet };
    });
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      return;
    }

    const response = await createCollection({ name: newName.trim(), isPrivate });
    if (response?.data) {
      setDraftSelection((prev) => {
        const currentIds = prev.baseKey === savedKey ? prev.ids : savedIds;
        return {
          baseKey: savedKey,
          ids: new Set(currentIds).add(response.data.id),
        };
      });
      setNewName('');
      setShowCreateForm(false);
    }
  };

  const handleClose = () => {
    setDraftSelection({ baseKey: savedKey, ids: new Set(savedIds) });
    setShowCreateForm(false);
    setNewName('');
    onClose();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const removals = [...savedIds].filter(id => !selectedIds.has(id));
      const additions = [...selectedIds].filter(id => !savedIds.has(id));

      for (const collectionId of removals) {
        await toggleCollection({ collectionId, isCurrentlyInCollection: true });
      }
      for (const collectionId of additions) {
        await toggleCollection({ collectionId, isCurrentlyInCollection: false });
      }
      onSaved?.();
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Save to Collection"
      size="sm"
      centered
    >
      {isLoading || isLoadingArtworkCollections
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
                disabled={!hasChanges}
              >
                Save changes
              </Button>
            </Stack>
          )}
    </Modal>
  );
}
