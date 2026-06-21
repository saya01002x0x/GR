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

---

#### Định tuyến động trong Clerk Component (Localized Clerk Routing)
- **Là gì:** Cấu hình đường dẫn điều hướng nội bộ (\signInUrl\, \signUpUrl\) thủ công cho các component \<SignIn>\ và \<SignUp>\ khi sử dụng định tuyến đa ngôn ngữ (i18n).
- **Cách dùng:**
  ```tsx
  <SignIn
    path={getI18nPath('/sign-in', locale)}
    signUpUrl={getI18nPath('/sign-up', locale)}
  />
  ```
- **Ứng dụng:** Dùng để đồng bộ hóa liên kết "Sign up" bên trong component Đăng nhập của Clerk và liên kết "Sign in" trong component Đăng ký của Clerk tương ứng với locale hiện tại, tránh bị văng về trang mặc định không có prefix ngôn ngữ của Clerk.

---

#### Clerk ID vs Database UUID (useUser vs useUserProfile)
- **Là gì:** useUser (Clerk) trả về user auth object với ID định dạng chuỗi (user_xxx), trong khi useUserProfile trả về user từ Database với ID định dạng UUID.
- **Cách dùng:** 
  ```tsx
  const { user: clerkUser } = useUser(); // ID: user_2pz...
  const { data: userProfile } = useUserProfile(); // ID: 123e4567-e89b-12d3...
  ```
- **Ứng dụng:** Tránh lỗi so sánh ID (isOwner) giữa Frontend và Backend. Cần dùng userProfile?.id khi so sánh với khóa chính (ID) của dữ liệu trả về từ DB (như comment.user.id).

---

#### Lấy Route Params trong Client Component (useParams)
- **Là gì:** Hook của Next.js App Router (`next/navigation`) dùng để lấy các dynamic segment từ URL trực tiếp bên trong Client Component.
- **Cách dùng:**
  ```tsx
  'use client';
  import { useParams } from 'next/navigation';

  export default function Page() {
    const params = useParams();
    const id = params.id as string;
    return <div>{id}</div>;
  }
  ```
- **Ứng dụng:** Được dùng trong `/artworks/[id]/review/page.tsx` để lấy tham số `id` và truyền vào `useArtwork(id)` để fetch dữ liệu từ Backend.

---

#### Intersection Observer (Infinite Scroll) với Mantine
- **Là gì:** Kỹ thuật nhận biết khi nào một phần tử DOM (như nút Loading) xuất hiện trên màn hình (viewport). Dùng kết hợp với React Query để tự động tải thêm dữ liệu.
- **Cách dùng:**
  ```tsx
  import { useIntersection } from '@mantine/hooks';
  
  const { ref, entry } = useIntersection({ threshold: 0.1 });
  
  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage) fetchNextPage();
  }, [entry?.isIntersecting]);

  return <Box ref={ref}><Loader /></Box>;
  ```
- **Ứng dụng:** Dùng ở trang Feed (`feed/page.tsx`) để nhận biết khi người dùng cuộn đến cuối danh sách thì tự động gọi `fetchNextPage()` để lấy thêm các bài viết mới, thay vì phải bắt người dùng bấm nút "Load More" thủ công.

---

#### Cố định chiều cao, chiều rộng động và Gradient Fade (Xử lý ảnh dài)
- **Là gì:** Kỹ thuật CSS giữ tỉ lệ ảnh gốc bằng cách cho ảnh lấp đầy chiều rộng (`width="100%"`), nhưng giới hạn chiều cao tổng thể không vượt quá màn hình (`max-height`). Nếu ảnh bị cắt, chèn một lớp gradient làm mờ phần đuôi để báo hiệu.
- **Cách dùng:**
  ```tsx
  <Box style={{ maxHeight: '70vh', overflow: 'hidden', position: 'relative' }}>
    <Image src={url} style={{ width: '100%', height: 'auto' }} />
    
    {/* Gradient Overlay cho ảnh bị cắt */}
    <Box 
      style={{ 
        position: 'absolute', bottom: 0, height: 160, width: '100%',
        background: 'linear-gradient(to top, black, transparent)' 
      }} 
    />
  </Box>
  ```
- **Ứng dụng:** Dùng trong `FeedArtworkCard` để hiển thị ảnh của artist đẹp mắt (tràn 100% card) nhưng không bị phá vỡ tỉ lệ và không quá dài (Webtoon) làm hỏng trải nghiệm cuộn Feed.

#### TanStack Query Prefetching
- **Là gì:** Kỹ thuật tải trước dữ liệu vào bộ nhớ đệm (cache) trước khi người dùng thực sự cần đến nó.
- **Cách dùng:** queryClient.prefetchQuery({ queryKey, queryFn }) gắn vào các sự kiện như onMouseEnter.
- **Ứng dụng:** Giúp người dùng khi click vào Nav link hoặc mở Artwork detail cảm thấy data tải ngay lập tức vì nó đã được cache sẵn từ lúc hover.

#### Next.js Image Component
- **Là gì:** Component <Image> tích hợp sẵn của Next.js giúp tối ưu hình ảnh tự động.
- **Cách dùng:** import Image from 'next/image'; <Image src={url} fill sizes="..." />.
- **Ứng dụng:** Tự động lazy load hình ảnh không nằm trong khung hình và nén ảnh sang định dạng WebP để giảm dung lượng, áp dụng trong ArtworkCard.
# # # #   M a n t i n e   P o p o v e r   f o r   A u t o c o m p l e t e 
 -   * * L �   g � : * *   C o m p o n e n t   \ P o p o v e r \   c �a   M a n t i n e   d � n g   �  t �o   m �t   k h u n g   n �i   ( d r o p d o w n )   � n h   k � m   v � o   m �t   t a r g e t   e l e m e n t   ( v �   d �  \ T e x t I n p u t \ ) . 
 -   * * C � c h   d � n g : * * 
     \ \ \ 	 s x 
     i m p o r t   {   P o p o v e r ,   T e x t I n p u t ,   S t a c k ,   T e x t   }   f r o m   ' @ m a n t i n e / c o r e ' ; 
     
     < P o p o v e r   o p e n e d = { i s O p e n e d }   w i d t h = \  
 t a r g e t \   p o s i t i o n = \ b o t t o m \ > 
         < P o p o v e r . T a r g e t > 
             < T e x t I n p u t   o n F o c u s = { ( )   = >   s e t I s O p e n e d ( t r u e ) }   / > 
         < / P o p o v e r . T a r g e t > 
         < P o p o v e r . D r o p d o w n > 
             < S t a c k > 
                 < T e x t > G �i   �   1 < / T e x t > 
             < / S t a c k > 
         < / P o p o v e r . D r o p d o w n > 
     < / P o p o v e r > 
     \ \ \ 
 -   * * �n g   d �n g : * *   D � n g   �  x � y   d �n g   t � n h   n n g   A u t o c o m p l e t e   T a g   k h i   n g ��i   d � n g   g �   t � m   k i �m   t r o n g   S e a r c h B a r . t s x ,   c h o   p h � p   t � y   c h �n h   g i a o   d i �n   d r o p d o w n   l i n h   h o �t   h �n   s o   v �i   c o m p o n e n t   A u t o c o m p l e t e   c �   s �n .  
 