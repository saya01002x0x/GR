'use client';

import type { MantineSize } from '@mantine/core';
import { ActionIcon, Box, Group, Loader, Popover, Stack, Text, TextInput, UnstyledButton } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconHash, IconSearch, IconX } from '@tabler/icons-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { apiClient } from '@/api/client';

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
  const inputRef = useRef<HTMLInputElement>(null);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [popoverOpened, setPopoverOpened] = useState(false);
  const [currentWord, setCurrentWord] = useState('');

  const getWordAtCursor = (val: string, cursorPosition: number) => {
    const left = val.slice(0, cursorPosition).split(/\s+/).pop() || '';
    const right = val.slice(cursorPosition).split(/\s+/)[0] || '';
    return left + right;
  };
  useEffect(() => {
    if (!currentWord || currentWord.length < 2) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setSuggestions([]);
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setPopoverOpened(false);
      return;
    }

    const cleanWord = currentWord.startsWith('#') ? currentWord.substring(1) : currentWord;

    const timeoutId = setTimeout(() => {
      apiClient.get(`/search/tags/autocomplete?q=${cleanWord}`).then((res) => {
        const data = (res as any).data;
        if (data && data.length > 0) {
          setSuggestions(data.map((d: any) => d.name));
          setPopoverOpened(true);
        } else {
          setSuggestions([]);
          setPopoverOpened(false);
        }
      }).catch(() => {
        setSuggestions([]);
        setPopoverOpened(false);
      });
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [currentWord]);

  const handleSuggestionClick = (tag: string) => {
    const pos = inputRef.current?.selectionStart || value.length;
    const textBefore = value.slice(0, pos);
    const textAfter = value.slice(pos);

    const wordsBefore = textBefore.split(/\s+/);
    wordsBefore.pop(); // remove current word left part
    const newTextBefore = wordsBefore.length > 0 ? `${wordsBefore.join(' ')} ` : '';

    const wordsAfter = textAfter.split(/\s+/);
    wordsAfter.shift(); // remove current word right part
    const newTextAfter = wordsAfter.length > 0 ? ` ${wordsAfter.join(' ')}` : '';

    const newValue = `${newTextBefore}#${tag} ${newTextAfter}`;
    setValue(newValue);
    setPopoverOpened(false);

    // Focus and move cursor
    setTimeout(() => {
      inputRef.current?.focus();
      const newCursor = newTextBefore.length + tag.length + 2;
      inputRef.current?.setSelectionRange(newCursor, newCursor);
      setCurrentWord(getWordAtCursor(newValue, newCursor));
    }, 0);
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <Popover width="target" position="bottom" withArrow shadow="md" opened={popoverOpened}>
        <Popover.Target>
          <TextInput
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setCurrentWord(getWordAtCursor(e.target.value, e.target.selectionStart ?? e.target.value.length));
            }}
            onSelect={(e) => {
              setCurrentWord(getWordAtCursor(e.currentTarget.value, e.currentTarget.selectionStart ?? e.currentTarget.value.length));
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                setPopoverOpened(true);
              }
            }}
            onBlur={() => setTimeout(() => setPopoverOpened(false), 200)}
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
        </Popover.Target>
        <Popover.Dropdown p={0}>
          <Stack gap={0}>
            {suggestions.map(tag => (
              <UnstyledButton
                key={tag}
                p="sm"
                onClick={() => handleSuggestionClick(tag)}
                style={() => ({
                  '&:hover': {
                    backgroundColor: 'var(--mantine-color-default-hover)',
                  },
                })}
              >
                <Group gap="sm">
                  <IconHash size={16} color="var(--mantine-color-dimmed)" />
                  <Text size="sm">{tag}</Text>
                </Group>
              </UnstyledButton>
            ))}
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </Box>
  );
}
