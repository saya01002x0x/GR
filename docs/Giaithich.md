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
