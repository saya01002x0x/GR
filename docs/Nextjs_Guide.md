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

---

#### Server Components Data Fetching với auth() (Clerk)
- **Là gì:** Pattern fetch dữ liệu an toàn trên Server trong Next.js (App Router), kết hợp với `@clerk/nextjs/server` để lấy token của người dùng hiện tại (nếu có đăng nhập).
- **Cách dùng:**
  ```tsx
  import { auth } from '@clerk/nextjs/server';
  
  export default async function Page() {
    const { getToken } = await auth();
    const token = await getToken();
    
    const res = await fetch('api_url', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store', // Không cache kết quả nếu dữ liệu thay đổi thường xuyên
    });
    const data = await res.json();
    return <div>{data.name}</div>;
  }
  ```
- **Ứng dụng:** Dùng ở trang `ArtistProfilePage` để fetch chi tiết của Artist ngay trên server, tối ưu SEO và bảo mật do không lộ logic fetch API ở client. Kết hợp `Authorization` header để backend biết ai đang xem profile (phục vụ hiển thị private artwork nếu đã subscribe).
