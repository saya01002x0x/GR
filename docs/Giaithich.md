# 📝 Giải Thích Logic Dự Án

Tài liệu ghi lại logic và lý do chọn giải pháp cho từng feature.

---

### [30/03] - Hybrid Counter System (View, Like, Comment + Meilisearch Sync)

**Logic:**
Hệ thống đếm View, Like, Comment được triển khai theo mô hình **Hybrid** gồm 3 tầng:

1. **Write-through Cache (Redis):** 
   - View: Redis `SET NX EX 600` để chặn spam (1 view/user/IP mỗi 10 phút), `INCR` để đếm nhanh.
   - Meilisearch Buffer: Dùng Redis Hash (`meili_sync_buffer`) để gom các stats update trước khi flush sang Meilisearch.

2. **Background Job (BullMQ):**
   - Khi có Like/Comment/View, chỉ ghi bản ghi quan hệ (ACID) rồi đẩy Job async để cập nhật counter trên bảng Artwork.
   - `StatsProcessor` nhận Job, increment counter trong Postgres và buffer update cho Meilisearch.

3. **Scheduled Reconciliation (Cron):**
   - Cron Job chạy 3:00 AM hàng ngày, `COUNT(*)` thực tế từ bảng Like/Comment, so sánh và sửa counter trên bảng Artwork.
   - Đây là "safety net" cho eventual consistency.

**Decision:**
- **Tại sao Redis Hash thay vì in-memory Map?** → Server crash/restart sẽ mất buffer. Redis Hash đảm bảo crash-safe.
- **Tại sao GETDEL cho View flush?** → Tránh race condition: đọc số + reset 0 phải nguyên tử, nếu không sẽ mất view trong khoảnh khắc giữa GET và DEL.
- **Tại sao BullMQ jobId cho Like/Comment?** → Nếu Job retry (network lag), counter có thể bị increment 2 lần. jobId giúp BullMQ tự dedup.
- **Tại sao tách $transaction?** → Giảm latency cho user. Ghi Like record (fast) → return ngay → counter update chạy background. Trade-off: likeCount optimistic (sai 1-2s), nhưng UX tốt hơn.
- **Tại sao ScheduleModule.forRoot() lên AppModule?** → NestJS best practice: `.forRoot()` chỉ gọi 1 lần duy nhất ở root module.
- **Tại sao BullModule.forRootAsync() cũng lên AppModule?** → `forRootAsync()` set Redis connection cho BullMQ. Nếu chỉ nằm trong QueueModule, các module khác (StatsModule, LikesModule) register queue nhưng không có connection config → `statsQueue.add()` fail 500. Chuyển lên AppModule = global access.
- **Tại sao wrap statsQueue.add() trong try-catch?** → Nếu Redis/BullMQ tạm lỗi, thao tác ACID (Like record, Comment record) đã thành công rồi → không nên trả 500 cho user. Counter sẽ được fix bởi reconciliation cron 3AM.
- **Tại sao getLikeStatus dùng COUNT(*) thay vì artwork.likeCount?** → `likeCount` trên Artwork table là denormalized counter, được update bất đồng bộ qua BullMQ. Nếu SWR refetch `like-status` trước khi job xử lý xong → trả về giá trị cũ → ghi đè optimistic update → UX tệ. `COUNT(*)` từ Like table là source of truth, luôn chính xác ngay lập tức.

---

### [30/03] - Infrastructure & Monitoring Overhaul (Prometheus, Grafana, Sentry)

**Logic:**
Nâng cấp hạ tầng để hệ thống ready cho production test với load lớn:
1. **Prometheus & Grafana:** Tích hợp trực tiếp vào backend qua `@willsoto/nestjs-prometheus` với endpoint `/metrics`. Chạy bằng Docker container cục bộ chung mạng `gr-network`. Grafana dùng port `3002`.
2. **Sentry Error Tracking:** Bắt tất cả exception không control được qua `BaseExceptionFilter` và `Sentry.captureException()`. Đặc biệt áp dụng Sentry vào khối `catch` của BullMQ `StatsProcessor` để bắt lỗi khi job ngầm sập.
3. **Audit Log Interceptor:** Dùng Interceptor của NestJS để tự động bọc mọi request thay đổi data từ Admin/Mod thay vì gọi thủ công `this.auditLogsService.log()`.
4. **k6 Load Testing:** Bổ sung script test mô phỏng 100 User ảo xem và like cùng lúc để kiểm tra năng lực chịu tải của Redis.

**Decision:**
- **Tại sao bỏ BetterStack và LogTape?** → Sentry (Errors) và Grafana (Metrics) đã làm quá tốt nhiệm vụ Monitoring. Việc ôm thêm 1 logging tool như LogTape / BetterStack làm cồng kềnh dự án và lãng phí tài nguyên/kỹ sư bảo trì. Đơn giản là tạo một `console` wrapper thay thế.
- **Tại sao dùng Interceptor cho Audit Log?** → Tách biệt Business Logic và Audit Logic(AOP - Aspect Oriented Programming). Controller không cần biết nó đang bị log. Code dễ đọc và sạch sẽ hơn.
- **Tại sao gõ SentryFilter tự tuỳ biến thay vì setupNestErrorHandler của Sentry?** → Vấn đề khác biệt phiên bản Sentry v8/v9 với NestJS adapter làm code dễ hỏng. Wrapper tùy chỉnh mỏng và ổn định.
- **Tại sao quy hoạch Lefthook ở Root?** → Trong kiểu dự án Monorepo/Workspace, kỉ luật code (lint, commit rule, hook) phải được áp dụng đồng bộ ở thư mục root chứ không nên phân mảnh mỗi sub-folder một cấu hình riêng.

---

### [02/06] - Fix Artist Tiers API Response Format

**Logic:**
Backend controller trả kết quả Prisma trực tiếp (raw array/object) cho các endpoint Artist Tier (`GET/POST/PATCH/DELETE /payments/tiers/me`). Frontend (React Query + apiClient) kỳ vọng response có dạng `{ message: string, data: T }`. Khi frontend truy cập `tiersData.data`, nó nhận được raw array thay vì wrapper object → `.data` trên array = `undefined` → tiers luôn rỗng.

**Decision:**
- **Tại sao wrap response ở Controller thay vì Service?** → Service nên trả raw data (SRP - Single Responsibility). Controller là lớp chịu trách nhiệm format HTTP response. Giữ cho Service có thể tái sử dụng bởi các consumer khác (webhook, cron, ...) mà không bị ràng buộc format.
- **Tại sao không dùng global interceptor wrap response?** → Dự án đã có nhiều endpoint trả response trực tiếp (không wrap). Dùng interceptor global sẽ double-wrap. Fix từng controller method an toàn hơn.

---

### [02/06] - Artwork Tier Visibility UI

**Logic:**
Bổ sung tính năng cho phép Artist chọn Tier khi upload Artwork. 
- Mặc định ảnh được thiết lập ở chế độ `PUBLIC`.
- Khi chọn `TIER_GATED`, một danh sách xổ xuống (`Select` component) sẽ hiện ra chứa các Tier hiện có của Artist, bắt buộc phải chọn 1 Tier (`requiredTierId`).
- Các trường này được nối thêm vào `FormData` trong quá trình submit và được xử lý lưu vào Database bởi backend controller (`artworks.controller.ts`).

**Decision:**
- **Tại sao dùng Collapse thay vì render Select trực tiếp bên cạnh Radio?** → Để giữ giao diện Upload được gọn gàng. Chỉ khi người dùng bấm vào "Tier Gated" thì form mới mở rộng để chọn tier, làm UI trở nên sạch sẽ và tránh làm rối mắt các Artist chỉ đăng ảnh miễn phí.
- **Tại sao Fetch Tiers trong Component Upload?** → Sử dụng custom hook `useMyTiers` đã có sẵn (dựa trên React Query) giúp tự động quản lý cache, deduplicate requests và fetch danh sách tier mới nhất cho form mà không tốn công setup lại API call.

---

### [02/06] - Fix Upload 500: MIME Type Mismatch giữa Frontend và Backend

**Logic:**
Frontend sử dụng `IMAGE_MIME_TYPE` của Mantine Dropzone cho phép 8 loại ảnh: `jpeg, png, gif, webp, avif, heic, heif, svg+xml`. Tuy nhiên, backend Multer `fileFilter` chỉ chấp nhận 4 loại: `jpeg, png, gif, webp`. Khi người dùng upload file AVIF/HEIC (đặc biệt phổ biến trên iPhone) hoặc SVG, frontend chấp nhận nhưng backend reject → trả 500 Internal Server Error.

**Decision:**
- **Tại sao sửa ở backend thay vì giới hạn frontend?** → AVIF và HEIC là format ảnh hiện đại, tiết kiệm dung lượng, và là format mặc định của iPhone/macOS. Chặn chúng ở frontend sẽ làm UX tệ đi cho người dùng Apple. Mở rộng whitelist backend là cách tiếp cận bao trùm hơn.
- **Tại sao luôn giữ frontend và backend filter đồng bộ?** → Nếu 2 danh sách lệch nhau, người dùng sẽ thấy Dropzone chấp nhận file (không báo lỗi) nhưng khi submit thì server trả lỗi → trải nghiệm rất khó hiểu và frustrating.

---

### [02/06] - Fix Images Not Displaying on Dashboard Works (Data Shape Mismatch + Queue Race Condition)

**Logic:**
Sau khi upload thành công, artist được redirect đến `/dashboard/works` nhưng ảnh không hiển thị. Có 2 nguyên nhân:

1. **Data Shape Mismatch:** Frontend (`works/page.tsx`) truy cập `artwork.images?.[0]?.thumbnailUrl` — mong đợi mảng `images` lồng bên trong artwork. Nhưng backend `findByUserId()` trả về flat object `{ id, title, thumbnailUrl }` (không có mảng `images`). Kết quả: `artwork.images` luôn `undefined` → luôn hiện placeholder.

2. **Queue Race Condition:** Backend tạo artwork với `status: 'PROCESSING'` và trả response ngay. Queue (BullMQ) xử lý ảnh bất đồng bộ (NSFW check, watermark, thumbnail generation). Khi frontend fetch ngay lập tức, artwork chưa có `ArtworkImage` records trong DB → ảnh trống.

**Fix:**
- Backend `findByUserId()`: Bỏ flatten, trả full Prisma object kèm `images[]` array.
- Backend Controller: Bỏ transform layer, pass through data trực tiếp.
- Frontend `useMyArtworks()`: Thêm `refetchInterval` dạng function — tự động poll mỗi 5s nếu có artwork đang `PROCESSING`.
- Frontend `works/page.tsx`: Thêm UI trạng thái cho `PROCESSING` (Loader + badge) và `FAILED` (icon cảnh báo + badge đỏ).

**Decision:**
- **Tại sao trả full Prisma object thay vì sửa frontend đọc flat field?** → Giữ response shape nhất quán với các endpoint khác (`findAll`, `findById`) đều trả `images[]`. Frontend components có thể tái sử dụng cùng type definition.
- **Tại sao dùng `refetchInterval` function thay vì fixed interval?** → Chỉ poll khi cần (có artwork PROCESSING). Khi tất cả artwork đã PUBLISHED, tự động dừng poll → tiết kiệm bandwidth và server load.
- **Tại sao 5 giây?** → Cân bằng giữa UX (không chờ quá lâu) và server load. Queue processing thường mất 10-30s cho NSFW AI check + image resize + upload.

---

### [02/06] - Thay thế Mock Data bằng Real Data cho Artist Detail Page

**Logic:**
Trang Artist Detail (`/artists/[username]`) được cập nhật để sử dụng dữ liệu thật từ Backend thay cho Mock Data:
1. **Server Component Fetching:** Lấy thông tin chung của Artist (tên, avatar, bio, stats) trực tiếp trên Server thông qua `fetch` và `auth()` của Clerk.
2. **Client-side Fetching (Infinite Query):** Danh sách các Artworks của Artist được chuyển xuống Client Component (`ArtworkGallery`) sử dụng `useInfiniteQuery` để hỗ trợ tính năng "Load more" và lọc theo Tier/Visibility.
3. Cập nhật Backend để hỗ trợ tìm kiếm Artist theo cả `id` hoặc `username` (sử dụng parameter `identifier`).

**Decision:**
- **Tại sao lại dùng Identifier trên Backend?** → Thay vì tạo thêm endpoint mới cho Username hoặc ép Frontend gọi theo ID, việc cho phép Backend lookup theo cả hai (`OR: [{ id }, { username }]`) giúp tối giản số lượng endpoint mà vẫn đáp ứng được nhu cầu routing của Frontend (`/[username]`).
- **Tại sao kết hợp Server & Client Fetching?** → Server fetching cho profile giúp SEO tốt hơn và giảm thời gian hiển thị nội dung chính. Tuy nhiên, Artwork gallery cần tính tương tác cao (chuyển tab, phân trang) nên bắt buộc phải xử lý ở Client. Đây là mô hình Hybrid lý tưởng trong Next.js.
- **Xử lý các trường Mock chưa có ở Backend (Badges, Socials):** Tạm thời comment/ẩn các tính năng này để tránh rườm rà trong database, đợi khi có schema chính thức sẽ mở lại.

---

### [02/06] - Membership Tier Feature & Server-side Image Blurring

**Logic:**
Xây dựng tính năng "Membership" cho phép Artist hiển thị các gói Đăng ký (Tier) của mình kèm theo ảnh preview của các Artwork độc quyền.
- **Backend:** Mở rộng quá trình xử lý ảnh trên hàng đợi (BullMQ `artwork.processor.ts`) để tạo thêm một bản sao bị làm mờ (blur radius 30) bên cạnh bản gốc và bản thumbnail. Lưu đường dẫn vào trường `blurredUrl` mới.
- **Frontend:** Thiết kế lại Component `ArtworkGallery`, chia thành 4 Tab (All Artworks, Free, 💎 Premium, ⭐ Membership). Tab Membership sẽ hiển thị các Card giới thiệu Tier kèm theo lưới ảnh preview bị làm mờ và nút "Subscribe".

**Decision:**
- **Tại sao lại làm mờ ảnh (Blur) ở Server thay vì Client (CSS `filter: blur()`)?** → Nếu dùng CSS blur, trình duyệt vẫn tải bức ảnh gốc rõ nét về máy tính người dùng. Bất kỳ ai biết dùng DevTools đều có thể tải được ảnh gốc mà không cần mua Tier. Server-side blurring bằng thư viện `sharp` tạo ra một file ảnh thực sự bị mờ (không thể khôi phục), đảm bảo bảo mật tuyệt đối cho nội dung trả phí.
- **Tại sao tách riêng `Premium` tab và `Membership` tab?** → Tab `Membership` đóng vai trò như một trang "Landing page" để sale các Tier (phô diễn lợi ích, số lượng member, preview ảnh mờ). Tab `Premium` đóng vai trò là nơi tiêu thụ nội dung (cho những người ĐÃ mua Tier), với một Dropdown lọc theo từng Tier cụ thể. Sự tách biệt này giúp luồng UX rõ ràng hơn giữa việc "mua sắm" và "thưởng thức".

---

### [02/06] - Fix Payment API Response Wrapper

**Logic:**
Phát hiện lỗi không thể redirect sang trang thanh toán Stripe giả lập. Nguyên nhân là do các endpoint trong `payments.controller.ts` (như `subscribeToTier`, `createSubscriptionCheckout`) trả về trực tiếp `{ checkoutUrl, sessionId }` mà không bọc trong wrapper `{ message: 'OK', data: ... }`. Tuy nhiên Frontend (`ApiClient.post`) và các component (`MembershipTab.tsx`) đều kỳ vọng `response.data.checkoutUrl`. Vì thiếu wrapper `data`, property này bị `undefined`.

**Decision:**
- **Giải pháp:** Sửa lại toàn bộ các phương thức trong `payments.controller.ts` để đồng bộ trả về `{ message, data }`.
- **Tại sao lại sửa Backend thay vì Frontend?** → Giữ tính nhất quán trên toàn bộ hệ thống API. Các endpoint khác đều đang tuân thủ quy tắc bọc response này, nên Backend cần được sửa để chuẩn hóa interface thay vì để Frontend phải xử lý ngoại lệ bằng `data?.data?.checkoutUrl || data?.checkoutUrl`.

---

### [02/06] - Fix Subscription Webhook Race Condition & Frontend Query Caching

**Logic:**
Sau khi thanh toán thành công trong chế độ Sandbox, tiền đã lên dashboard nhưng người dùng vẫn thấy trạng thái "Subscribe". Hai nguyên nhân chính được phát hiện:
1. **Lỗi DB Lookup trên Webhook:** Khi Stripe gửi webhook `checkout.session.completed`, Backend tìm TierSubscription bằng cách tra cứu `status: 'ACTIVE'`. Điều này tạo ra bug lớn: Nếu webhook đến không theo thứ tự hoặc subscription lúc mới tạo là `'incomplete'`, việc tìm theo `'ACTIVE'` sẽ thất bại và Backend sẽ tạo thêm một bản ghi rác mới thay vì update bản ghi có sẵn.
2. **Race condition ở Frontend (React Query + Clerk Auth):** Các hook `useArtistTierPreviews` và `useArtistArtworks` gán hàm lấy token cho `apiClient` bên trong khối `useEffect`. Nhưng `useQuery` của React Query luôn trigger gọi API **ngay lập tức** ở lần render đầu tiên (trước khi `useEffect` kịp chạy). Kết quả: API call bay đi mà không mang theo Access Token, khiến Backend tưởng đó là user ẩn danh (Guest) → trả về trạng thái "chưa subscribe".

**Decision:**
- **Sửa Backend:** Cập nhật hàm `handleTierSubscriptionCreated` trong `payments.service.ts` để luôn tra cứu duy nhất qua trường `providerSubId` (ID subscription của Stripe) nhằm đảm bảo tính nguyên tử (Atomicity), không phụ thuộc vào `status` cũ.
- **Sửa Frontend:** Dời lệnh `apiClient.setTokenGetter(getToken)` ra khỏi `useEffect` để chạy đồng bộ ngay lúc render. Đồng thời thêm điều kiện `enabled: isLoaded && !!identifier` vào `useQuery` để đảm bảo lệnh fetch chỉ chạy sau khi Clerk Auth đã tải xong dữ liệu tài khoản.
