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

---

#### Tích hợp HTML5 Canvas trong React (Next.js Client Component)
- **Là gì:** HTML5 `<canvas>` cho phép vẽ đồ hoạ 2D bằng Javascript. Khi dùng trong React, cần kết hợp `useRef` để truy xuất DOM Node và gắn các sự kiện chuột/chạm (mouse/touch events) để bắt nét vẽ.
- **Cách dùng:**
  ```tsx
  'use client';
  import { useRef, useEffect } from 'react';

  export function DrawingCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Có thể gắn event listener onMouseDown, onMouseMove lên thẻ <canvas>
    // Khi muốn lấy ảnh:
    const saveImage = () => {
      if (canvasRef.current) {
        const base64Data = canvasRef.current.toDataURL('image/png');
        // Gửi base64Data lên API
      }
    };

    return <canvas ref={canvasRef} width={600} height={400} />;
  }
  ```
- **Ứng dụng:** Được dùng trong `SketchSearchModal` để cho phép người dùng vẽ phác thảo bức tranh. Base64 xuất ra từ canvas sẽ được gửi qua `useAiSearchSketch` (React Query) lên Backend để convert thành vector.

---

#### Hạn chế Component Polymorphism (Mantine 8 với Next.js Link)
- **Là gì:** Việc truyền component khác (như `Link` của Next.js) qua prop `component` trong Mantine đôi khi gây xung đột kiểu dữ liệu (TypeScript Type Collision) do các thuộc tính HTML bị chồng chéo.
- **Cách dùng:**
  Thay vì:
  ```tsx
  <Image component={Link} href="/destination" alt="..." />
  ```
  Hãy bọc trực tiếp:
  ```tsx
  <Link href="/destination">
    <Image alt="..." />
  </Link>
  ```
- **Ứng dụng:** Khắc phục lỗi compiler `alt does not exist` trên Mantine `Image` trong component `FeaturedArtwork`.

#### Định tuyến động trong Clerk Component (Localized Clerk Routing)
- **Là gì:** Cấu hình đường dẫn điều hướng nội bộ (\signInUrl\, \signUpUrl\) thủ công cho các component \<SignIn>\ và \<SignUp>\ khi sử dụng định tuyến đa ngôn ngữ (i18n).
- **Cách dùng:**
  \\\	sx
  <SignIn
    path={getI18nPath('/sign-in', locale)}
    signUpUrl={getI18nPath('/sign-up', locale)}
  />
  \\\`n- **Ứng dụng:** Dùng để đồng bộ hóa liên kết "Sign up" bên trong component Đăng nhập của Clerk và liên kết "Sign in" trong component Đăng ký của Clerk tương ứng với locale hiện tại, tránh bị văng về trang mặc định không có prefix ngôn ngữ của Clerk.

#### Clerk ID vs Database UUID (useUser vs useUserProfile)
- **Là gì:** useUser (Clerk) trả về user auth object với ID định dạng chuỗi (user_xxx), trong khi useUserProfile trả về user từ Database với ID định dạng UUID.
- **Cách dùng:** 
  `	sx
  const { user: clerkUser } = useUser(); // ID: user_2pz...
  const { data: userProfile } = useUserProfile(); // ID: 123e4567-e89b-12d3...
  `
- **Ứng dụng:** Tránh lỗi so sánh ID (isOwner) giữa Frontend và Backend. Cần dùng userProfile?.id khi so sánh với khóa chính (ID) của dữ liệu trả về từ DB (như comment.user.id).
