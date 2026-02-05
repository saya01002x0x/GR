'use client';

import { ActionIcon, Box, Loader, TextInput } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch, IconX } from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type SearchBarProps = {
  placeholder?: string;
  onSearch?: (query: string) => void;
};

export function SearchBar({ placeholder = 'Search artworks...', onSearch }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize from URL
  const [value, setValue] = useState(searchParams.get('q') || '');
  const [debounced] = useDebouncedValue(value, 300);

  // Sync URL when debounced value changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (debounced) {
      params.set('q', debounced);
    } else {
      params.delete('q');
    }

    // Update URL without scroll
    const newUrl = params.toString() ? `/search?${params}` : '/search';
    router.push(newUrl, { scroll: false });

    // Callback
    onSearch?.(debounced);
  }, [debounced, router, searchParams, onSearch]);

  const handleClear = () => {
    setValue('');
  };

  // Show loader when value differs from debounced (still typing)
  const isSearching = value !== debounced && value !== '';

  return (
    <Box>
      <TextInput
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        size="lg"
        radius="xl"
        leftSection={
          isSearching ? <Loader size="sm" /> : <IconSearch size={20} />
        }
        rightSection={
          value && (
            <ActionIcon
              variant="subtle"
              radius="xl"
              onClick={handleClear}
              aria-label="Clear search"
            >
              <IconX size={16} />
            </ActionIcon>
          )
        }
        styles={{
          input: {
            'backgroundColor': 'var(--mantine-color-dark-6)',
            'border': '1px solid var(--mantine-color-dark-4)',
            '&:focus': {
              borderColor: 'var(--mantine-color-blue-6)',
            },
          },
        }}
      />
    </Box>
  );
}
