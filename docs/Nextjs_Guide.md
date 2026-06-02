# 📚 Next.js Knowledge Guide

Tổng hợp các khái niệm Next.js và Frontend đã sử dụng trong dự án.

---

#### SWR (Stale-While-Revalidate)
- **Là gì:** Thư viện giúp fetch dữ liệu ở Client-side với các tính năng như caching, revalidation, và optimistic UI.
- **Cách dùng:**
  ```typescript
  import useSWR from 'swr';
  const { data, error } = useSWR('/api/user', fetcher);
  ```
- **Ứng dụng:** Dùng ở Trang chủ (`HeroSection`, `TrendingSection`, `ArtistSpotlight`) để lấy dữ liệu động từ Backend mà không làm chậm việc render ban đầu của trang (Async fetching).

---

#### React Query refetchInterval (Conditional Polling)
- **Là gì:** Option của `useQuery` cho phép tự động re-fetch data theo khoảng thời gian. Có thể truyền function để điều kiện hóa polling dựa trên data hiện tại.
- **Cách dùng:**
  ```typescript
  useQuery({
    queryKey: ['items'],
    queryFn: fetchItems,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Chỉ poll khi có item đang processing
      if (data?.some(item => item.status === 'PROCESSING')) return 5000;
      return false; // Dừng polling
    },
  });
  ```
- **Ứng dụng:** Dùng trong `useMyArtworks` hook để tự động poll mỗi 5s khi có artwork đang được queue xử lý (PROCESSING). Khi tất cả artwork đã PUBLISHED, polling tự dừng.
