'use client';

import { Box, Tabs, Title } from '@mantine/core';
import { useState } from 'react';
import { useFollowList } from '@/api/hooks';
import { FollowList } from '@/components/dashboard/FollowList';

export default function FollowsPage() {
  const [activeTab, setActiveTab] = useState<string | null>('followers');
  const [followersPage, setFollowersPage] = useState(1);
  const [followingPage, setFollowingPage] = useState(1);

  const followersQuery = useFollowList('followers', followersPage, 20);
  const followingQuery = useFollowList('following', followingPage, 20);

  return (
    <Box>
      <Title order={2} mb="lg">
        Follows
      </Title>

      <Tabs value={activeTab} onChange={setActiveTab} radius="md">
        <Tabs.List mb="md">
          <Tabs.Tab value="followers">Followers</Tabs.Tab>
          <Tabs.Tab value="following">Following</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="followers">
          <FollowList
            type="followers"
            items={followersQuery.data?.items}
            total={followersQuery.data?.total ?? 0}
            page={followersPage}
            limit={20}
            isLoading={followersQuery.isLoading}
            onPageChange={setFollowersPage}
          />
        </Tabs.Panel>

        <Tabs.Panel value="following">
          <FollowList
            type="following"
            items={followingQuery.data?.items}
            total={followingQuery.data?.total ?? 0}
            page={followingPage}
            limit={20}
            isLoading={followingQuery.isLoading}
            onPageChange={setFollowingPage}
          />
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}
