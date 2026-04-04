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
