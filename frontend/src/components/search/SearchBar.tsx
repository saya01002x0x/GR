'use client';

import type { MantineSize } from '@mantine/core';
import { ActionIcon, Box, Loader, TextInput } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch, IconX } from '@tabler/icons-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type SearchBarProps = {
  placeholder?: string;
  onSearch?: (query: string) => void;
  size?: MantineSize;
  radius?: MantineSize;
  leftSectionSize?: number;
  resetModeOnSearch?: boolean;
};

export function SearchBar({
  placeholder = 'Search artworks...',
  onSearch,
  size = 'lg',
  radius = 'xl',
  leftSectionSize = 20,
  resetModeOnSearch = true,
}: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize from URL
  const [value, setValue] = useState(searchParams.get('q') || '');
  const [debounced] = useDebouncedValue(value, 300);

  // Track if we just navigated to prevent loop
  const isNavigating = useRef(false);

  // Sync URL when debounced value changes - ONLY if we're on /search page
  useEffect(() => {
    // Only update URL if we're already on the search page
    if (!pathname?.includes('/search')) {
      return;
    }

    // Prevent loop: if we just navigated, skip this effect
    if (isNavigating.current) {
      isNavigating.current = false;
      return;
    }

    // Get current query from URL
    const currentQuery = searchParams.get('q') || '';

    // Only update if debounced value is different from URL
    if (debounced === currentQuery) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (debounced) {
      params.set('q', debounced);
      if (resetModeOnSearch) {
        params.set('mode', 'standard');
      }
    } else {
      params.delete('q');
      params.delete('mode');
    }

    // Update URL without scroll
    isNavigating.current = true;
    const newUrl = params.toString() ? `/search?${params}` : '/search';
    router.push(newUrl, { scroll: false });

    // Callback
    onSearch?.(debounced);
  }, [debounced, pathname]);

  const handleClear = () => {
    setValue('');
  };

  // Handle Enter key - bypass debounce for instant search
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const params = new URLSearchParams(searchParams.toString());

      if (value) {
        params.set('q', value);
        if (resetModeOnSearch) {
          params.set('mode', 'standard');
        }
      } else {
        params.delete('q');
        params.delete('mode');
      }

      isNavigating.current = true;
      const newUrl = params.toString() ? `/search?${params}` : '/search';
      router.push(newUrl, { scroll: false });
      onSearch?.(value);
    }
  };

  // Show loader when value differs from debounced (still typing)
  const isSearching = value !== debounced && value !== '';

  return (
    <Box>
      <TextInput
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        size={size}
        radius={radius}
        leftSection={
          isSearching ? <Loader size="sm" /> : <IconSearch size={leftSectionSize} />
        }
        rightSection={
          value && (
            <ActionIcon
              variant="subtle"
              radius={radius}
              onClick={handleClear}
              aria-label="Clear search"
            >
              <IconX size={16} />
            </ActionIcon>
          )
        }
      />
    </Box>
  );
}
