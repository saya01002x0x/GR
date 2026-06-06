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

---

### [03/06] - Duplicate Detection Module (Perceptual Hashing)

**Logic:**
Module phát hiện ảnh trùng lặp dựa trên Perceptual Hashing (pHash):
1. **Tạo Hash:** Khi upload ảnh, dùng `sharp-phash` để tạo "vân tay" (fingerprint) dạng chuỗi hex từ buffer ảnh. Hash này không phụ thuộc vào kích thước, nén, hay format — hai ảnh giống nhau về mặt thị giác sẽ có hash gần giống nhau.
2. **So sánh Hamming Distance:** Lấy toàn bộ phash đã lưu trong DB (`artwork_images.phash`), so sánh với hash mới bằng Hamming distance (số bit khác nhau giữa 2 hash). Distance ≤ 5 = gần như trùng; ≤ 10 = nghi ngờ trùng.
3. **Chặn Upload:** Method `checkAndReject()` tự động reject upload (throw `BadRequestException`) nếu phát hiện ảnh gần trùng (distance ≤ 5).

**Decision:**
- **Tại sao dùng Perceptual Hash thay vì MD5/SHA?** → MD5/SHA hash toàn bộ binary data. Chỉ cần resize hoặc re-compress ảnh là hash thay đổi hoàn toàn, không phát hiện được ảnh "giống nhau". pHash so sánh nội dung thị giác, robust với resize/crop/compression.
- **Tại sao so sánh in-memory thay vì SQL?** → Hamming distance giữa 2 chuỗi ngắn (64 bit) là O(1), cực nhanh. Với vài chục ngàn ảnh, việc fetch all + loop vẫn nhanh hơn viết custom SQL function. Khi scale lớn hơn có thể chuyển sang BK-tree hoặc pgvector.
- **Tại sao threshold 5 cho reject, 10 cho detect?** → Distance 0-5 gần như chắc chắn là cùng 1 ảnh (resize, crop nhẹ, nén khác). Distance 6-10 có thể là ảnh tương tự nhưng khác (cùng bối cảnh, góc chụp hơi khác) → chỉ cảnh báo, không block.

---

### [03/06] - AI Search Module (Gemini Embedding + pgvector)

**Logic:**
Module tìm kiếm ngữ nghĩa (semantic search) kết hợp Gemini Embedding API và pgvector:
1. **Text Search:** Người dùng nhập câu hỏi tự nhiên (VD: "girl with red hair") → Gemini API tạo vector embedding 768 chiều → pgvector tìm ảnh có embedding gần nhất (cosine distance `<=>`). Kết quả trả về kèm `similarity` score.
2. **Sketch Search (Premium):** Người dùng vẽ phác thảo → base64 image → Gemini multimodal embedding → pgvector search. Chỉ dành cho user có subscription ACTIVE.
3. **Redis Caching:** Embedding của text query được cache 7 ngày trong Redis (key: `search:vector:{query}`) để tránh gọi Gemini API lặp lại cho cùng một câu hỏi.
4. **Store Embedding:** Method `storeImageEmbedding()` được gọi khi upload ảnh để lưu vector vào cột `artwork_images.embedding`.

**Decision:**
- **Tại sao dùng `gemini-embedding-001` thay vì OpenAI?** → Google Gemini hỗ trợ multimodal embedding (cả text lẫn image) trong cùng 1 model, giúp so sánh cross-modal (text ↔ image) chính xác hơn. OpenAI tách riêng text embedding và image embedding.
- **Tại sao cache embedding trong Redis thay vì DB?** → Embedding là dữ liệu tạm thời (chỉ cần cho query hiện tại), không cần persist lâu dài. Redis có TTL tự động xóa sau 7 ngày, tránh tích lũy rác. DB chỉ lưu embedding của artwork images (cần persist vĩnh viễn).
- **Tại sao `DISTINCT ON (ai.artwork_id)`?** → Một artwork có nhiều images, mỗi image có embedding riêng. DISTINCT ON đảm bảo mỗi artwork chỉ xuất hiện 1 lần trong kết quả (lấy image có similarity cao nhất).
- **Tại sao Sketch Search yêu cầu Premium?** → Multimodal embedding tốn tài nguyên API hơn text embedding (xử lý image data). Giới hạn cho Premium user giúp kiểm soát chi phí API và tạo thêm giá trị cho gói trả phí.
- **Tại sao similarity threshold 0.3 cho sketch search?** → Sketch thường khác xa ảnh thực tế về chi tiết. Threshold 0.3 loại bỏ kết quả hoàn toàn không liên quan nhưng vẫn đủ rộng để bắt ảnh có bố cục/hình dáng tương tự.

---

### [03/06] - Recommendation Module (Item-based Collaborative Filtering)

**Logic:**
Module gợi ý artwork dựa trên hành vi tương tác của người dùng, gồm 3 thành phần chính:

1. **Interaction Tracking (`InteractionsService`):** Ghi nhận mỗi hành vi của user (VIEW=1, COMMENT=2, LIKE=3, UNLOCK=5) vào bảng `user_interactions` với trọng số (weight) tương ứng. Dùng Redis debounce cho VIEW (max 1 view/user/artwork/giờ). Upsert để tránh duplicate record.

2. **Item-based Collaborative Filtering (`RecommendationsService`):**
   - **Artwork recommendations:** Tìm tất cả user đã tương tác với artwork A → tìm các artwork khác mà nhóm user đó cũng tương tác → xếp hạng theo tổng weight → "Users who liked this also liked..."
   - **Personalized recommendations:** Tìm "similar users" (dựa trên artwork chung) → lấy artwork mà similar users thích nhưng user hiện tại chưa xem → nhân weight × affinity score → xếp hạng.

3. **Redis Caching:** Kết quả recommendation được cache 1 giờ (`recommend:artwork:{id}`, `recommend:user:{id}`). Cache bị invalidate khi có interaction mới đáng kể.

**Decision:**
- **Tại sao Item-based CF thay vì Content-based?** → Không cần metadata phức tạp (tag, style, genre). Chỉ cần bảng interaction là đủ. Phù hợp với nền tảng ảnh nơi taste rất chủ quan và khó mô tả bằng features.
- **Tại sao dùng Raw SQL (CTE) thay vì Prisma query builder?** → Query collaborative filtering cần CTE (`WITH`), self-join, và aggregation phức tạp. Prisma query builder không hỗ trợ CTE. Raw SQL rõ ràng và tối ưu hơn.
- **Tại sao debounce VIEW ở Redis thay vì DB unique constraint?** → VIEW là interaction phổ biến nhất (mỗi lần mở trang). Unique constraint sẽ tạo upsert write mỗi lần → overhead lớn. Redis `SET NX EX` rẻ hơn rất nhiều, chặn spam ở tầng cache trước khi vào DB.
- **Tại sao interaction tracking không throw error?** → Tracking là tính năng phụ trợ. Nếu Redis/DB tạm lỗi, main flow (xem artwork, like, comment) vẫn phải hoạt động bình thường. Error chỉ log, không propagate lên user.
- **Tại sao cache 1 giờ?** → Recommendation không cần real-time. 1 giờ đủ tươi để phản ánh trend mới, đủ dài để giảm load SQL query nặng trên bảng interaction lớn.

---

### [03/06] - Giao diện AI Search & Sketch to Search

**Logic:**
- Chuyển đổi trạng thái tìm kiếm (Meilisearch vs AI Semantic) trực tiếp trên giao diện bằng SegmentedControl.
- Sử dụng HTML5 `<canvas>` để người dùng vẽ hình phác thảo. Hình này được trích xuất thành chuỗi Base64 (`canvas.toDataURL()`).
- Gửi ảnh Base64 lên backend qua `useAiSearchSketch` (React Query Mutation).
- Kết quả trả về được map lại đúng chuẩn `SearchResponse` để tái sử dụng component `ArtworkCard` có sẵn.
- Sau khi vẽ xong, Modal tự đóng và giao diện Search hiển thị 1 "Visual Indicator" (Nhãn dán Thumbnail ảnh phác thảo) để người dùng biết họ đang xem kết quả tìm bằng ảnh.

**Decision:**
- Chọn cách không tạo thêm Sidebar bên phải để giữ nguyên layout 2 cột Grid hiện tại (tránh phá vỡ UX giữa User Free và Premium). Đặt nút "Sketch to Search" ở dạng Banner ngay trên cột Filters.
- Modal Canvas giúp người dùng vẽ dễ dàng mà không bị chuyển trang (mất bối cảnh trang hiện hành). Luồng "Vẽ -> Đóng Modal -> Hiện Nhãn -> Đổ Kết quả" tương đồng với chuẩn UX của Google Lens.

 # # #   [ 0 3 / 0 6 ]   -   [ D e t e r m i n i s t i c   D a t a b a s e   S e e d i n g ] 
 -   * * L o g i c : * *   X � y   d �n g   h �  t h �n g   t �  �n g   c h � n   d �  l i �u   t e s t   c �  �n h   v � o   D a t a b a s e   b �n g   @ f a k e r - j s / f a k e r   k �t   h �p   v �i   c �  �n h   s e e d   ( s e e d ( 4 2 ) ) .   H �  t h �n g   t �  �n g   u p l o a d   �n h   m �u   v � o   M i n I O   v �   s i n h   c � c   b �n   p r e v i e w ,   t h u m b ,   b l u r   t h � n g   q u a   s h a r p .   T ��n g   t � c   ( V i e w s ,   L i k e s ,   C o m m e n t s )   ��c   p h � n   b �  t h e o   t �  l �  ( T o p ,   M i d ,   L o w )   �  �m   b �o   B X H   l u � n   n h �t   q u � n   q u a   m �i   l �n   r e s e t . 
 -   * * D e c i s i o n : * *   T � c h   r i � n g   l o g i c   s e e d   t h � n h   t �n g   m o d u l e   ( u s e r s ,   a r t w o r k s ,   t a g s ,   i n t e r a c t i o n s ,   a d m i n )   �  d �  q u �n   l � .   L �n h   r e s e t   c h �  x � a   d a t a   t r o n g   P o s t g r e S Q L   c h �  k h � n g   x � a   �n h   t r � n   M i n I O   �  t i �t   k i �m   t h �i   g i a n   r e s e t   t e s t c a s e   ( x u �n g   c � n   ~ 2 s ) .  
 # # #   [ 0 3 / 0 6 ]   -   R e f a c t o r   D i s c o v e r   P a g e   &   P r e m i u m   L i m i t s 
 -   * * L o g i c : * *   S �  d �n g   R e d i s   �  t r a c k   r a t e   l i m i t   ( t � m   k i �m   s k e t c h   2   l �n / n g � y ,   t e x t   1 0   l �n / n g � y   c h o   n g ��i   d � n g   f r e e ) .   P h � t   t r i �n   A P I   P r o m o t e   A r t w o r k   g i �  l �p   t h a n h   t o � n ,   c h o   p h � p   s e t   t h �i   g i a n   F e a t u r e d   ( P r o m o t e )   c �a   A r t w o r k .   F r o n t e n d   s �  d �n g   s e t I n t e r v a l   �  t �o   C a r o u s e l   �n h   t �  �n g   c h o   c � c   A r t w o r k   ��c   p r o m o t e . 
 -   * * D e c i s i o n : * *   S �  d �n g   s e t I n t e r v a l   t h a y   v �   @ m a n t i n e / c a r o u s e l   �  g i �m   d e p e n d e n c y ,   s �  d �n g   R e d i s   t r �c   t i �p   q u a   i o r e d i s   t h a y   v �   p a c k a g e   r a t e - l i m i t   n g o � i   �  d �  c u s t o m   l o g i c   P r e m i u m   c h e c k . 
  
 
### [03/06] - Fix Export Hooks for Discover Page
- **Logic:** Thêm các export `useDiscoverHero`, `useFeaturedArtworks`, `useRanking`, `useRisingStars`, `usePopularTags` từ file `useDiscover.ts` vào file `api/hooks/index.ts`.
- **Decision:** Việc thiếu các export trong `index.ts` gây lỗi "export not found" trên Next.js (cả Server component lẫn Client component) ở trang Discover. Sửa lại để thống nhất cách import hooks chung từ `api/hooks`.

### [03/06] - Fix client import in useDiscover hooks
- **Logic:** Đổi import `client` thành `apiClient` trong file `frontend/src/api/hooks/useDiscover.ts`.
- **Decision:** File `frontend/src/api/client.ts` export biến `apiClient` (một instance của class ApiClient), không phải là `client`. Việc gọi nhầm tên export gây lỗi "export not found". Sửa lại để đảm bảo React Query gọi đúng API client instance.

### [06/06] - Sửa lỗi chuyển hướng trang Sign-in và Sign-up của Clerk
- **Logic:** Thêm prop \signUpUrl={getI18nPath('/sign-up', locale)}\ vào component \<SignIn>\ và prop \signInUrl={getI18nPath('/sign-in', locale)}\ vào component \<SignUp>\.
- **Decision:** Mặc định, component của Clerk sẽ chuyển hướng về \/sign-up\ hoặc \/sign-in\ không có locale prefix khi người dùng bấm chuyển đổi giữa Đăng ký/Đăng nhập. Khi dùng hệ thống i18n định tuyến động (ví dụ \/vi/sign-in\, \/en/sign-in\), điều này khiến Clerk điều hướng sai hoặc lỗi. Khai báo rõ ràng đường dẫn đã được i18n hóa thông qua Helper \getI18nPath\ giúp Clerk định tuyến chính xác.

### [06/06] - Fix lỗi Reply Comment & Xóa Comment
- **Logic:** 
  - **Reply Comment:** Thêm cờ `enabled` vào hook `useComments` và truyền `parentId = comment.id` ngay từ đầu thay vì gán `null` khi chưa mở rộng (expand) danh sách reply.
  - **Xóa Comment:** Thay đổi logic kiểm tra quyền sở hữu (`isOwner`) từ việc dùng Clerk ID (`user.id` từ `useUser`) sang dùng Database UUID (`userProfile.id` từ `useUserProfile`).
- **Decision:** 
  - API tạo comment yêu cầu `parentId` phải khớp với ID của comment cha. Việc truyền `null` khi state `showReplies` là false khiến comment bị thêm vào root (như một comment độc lập) thay vì làm reply. Thêm `enabled = showReplies || showReply` giúp ngăn fetch data không cần thiết mà vẫn giữ đúng `parentId`.
  - Database Prisma sử dụng UUID riêng cho bảng `User`, trong khi Clerk có ID định dạng chuỗi `user_2...`. Sử dụng đồng nhất Database UUID giúp logic `currentUserId === comment.user.id` hoạt động chính xác và hiển thị nút Xóa.

### [06/06] - Hide Banned Artworks
- **Logic:** Updated \dmin.service.ts\ to call \SearchService.removeArtwork()\ when an artwork is rejected, removing it from Meilisearch so it doesn't appear in search results. Added a status check in \rtworks.service.ts\ (\indById\) to throw a NotFoundException if the artwork is not PUBLISHED (unless the viewer is the author).
- **Decision:** Removing from the search index and blocking direct URL access ensures banned artworks are completely inaccessible to the public, while still allowing the original author to view them on their dashboard.


### [06/06] - Review Failed Uploads & Fix Recommendations
**Logic:**
- Luồng xử lý ảnh chạy ngầm (BullMQ) hỗ trợ theo dõi qua SSE (/artworks/job/:id/progress).
- Tạo trang /artworks/[id]/review dành cho artwork có status ACTION_REQUIRED hoặc IN_REVIEW. Hiển thị ảnh bị lỗi với viền đỏ và lý do. Có modal gửi ticket khiếu nại qua API /reports.
- Khôi phục @Get(':id/related') trong backend (artworks controller) để tránh match nhầm route ID gây lỗi 404 cho Related Artwork component trong Artwork Detail.

**Decision:**
- **Tại sao Discover trắng bóc?** Hệ thống Discover hiện tại chỉ lọc và hiển thị các artwork có status PUBLISHED. Vì ta đang test luồng mới với queue PROCESSING/FAILED/ACTION_REQUIRED, Database cục bộ chưa có artwork PUBLISHED mới nào, nên API trả về []. Khi Publish thành công, Discover sẽ hiển thị bình thường (có Hero, Featured Promoted, Ranking, và Rising Stars theo like/view).

### [06/06] - Local AI Embedding (Transformers.js) & Caching Seeder
- **Logic:** Chuy盻ハ ﾄ黛ｻ品 logic Semantic Search t盻ｫ Gemini API sang Local AI model Xenova/clip-vit-base-patch32 b蘯ｱng thﾆｰ vi盻㌻ `@xenova/transformers` (ch蘯｡y hoﾃn toﾃn b蘯ｱng CPU node.js). Gi蘯｣m chi盻「 Vector t盻ｫ 768 xu盻創g 512, thﾃｪm c盻冲 hasEmbedding (Boolean) ﾄ黛ｻ・ﾄ妥｡nh d蘯･u trﾃｪn Database. Tﾃｭch h盻｣p tﾃｭnh toﾃ｡n mﾃ｣ pHash vﾃ m蘯｣ng Vector vﾃo file artworks.seeder.ts, sau ﾄ妥ｳ ﾃ｡p d盻･ng thu蘯ｭt toﾃ｡n lﾆｰu tr盻ｯ Cache vﾃo `seed-data/embeddings-cache.json` ﾄ黛ｻ・tﾃ｡i s盻ｭ d盻･ng 盻・cﾃ｡c l蘯ｧn ch蘯｡y sau.
- **Decision:** Vi盻㌘ ﾄ柁ｰa mﾃｴ hﾃｬnh AI v盻・ch蘯｡y c盻･c b盻・(Local/Edge AI) giﾃｺp ti蘯ｿt ki盻㍊ 100% chi phﾃｭ API, gi蘯｣i quy蘯ｿt tri盻㏄ ﾄ黛ｻ・nguy cﾆ｡ dﾃｭnh Rate Limit c盻ｧa bﾃｪn th盻ｩ 3, ﾄ黛ｻ渡g th盻拱 gia tﾄハg ﾄ黛ｻ・kh盻ｧng cho ﾄ黛ｻ・ﾃ｡n. Cﾆ｡ ch蘯ｿ Cache JSON trong Seeder giﾃｺp h盻・th盻創g vﾆｰ盻｣t qua rﾃo c蘯｣n th盻拱 gian tﾃｭnh toﾃ｡n c盻ｧa AI, gi盻ｯ nguyﾃｪn t盻祖 ﾄ黛ｻ・reset DB siﾃｪu nhanh (vﾃi giﾃ｢y) mﾃ v蘯ｫn ﾄ黛ｺ｣m b蘯｣o data m蘯ｫu gi盻創g 100% th盻ｱc t蘯ｿ.

### [06/06] - Fix AI Embedding Memory Crashes (Child Process)
- **Logic:** Chuyển xử lý AI (Transformers.js sinh vector embedding) từ tiến trình chính sang tiến trình con (child_process) thông qua file ai-worker.ts. Giao tiếp qua IPC bằng cách truyền đường dẫn thumbnailUrl thay vì truyền Buffer thô. Thêm bắt sự kiện onModuleDestroy và exit để tiêu diệt (kill) tiến trình con.
- **Decision:** Việc chạy Sharp (xử lý ảnh C++) và AI model (WASM/C++) trên cùng một process gây tranh chấp bộ nhớ và dẫn đến crash (OOM). Tách sang child_process có RAM độc lập để xử lý. Gửi thumbnailUrl qua IPC thay vì Buffer giúp tránh serialize data nặng gây kẹt CPU. Kill child process khi NestJS restart giúp tránh rò rỉ RAM (Zombie Process).

### [06/06] - Fix Original Image Deletion
- **Logic:** Thêm trường `original_url` vào mô hình ArtworkImage. Trong quá trình upload ảnh ngầm (artwork.processor.ts), lưu giữ lại ảnh gốc (chỉ xoay và xoá EXIF metadata để bảo vệ quyền riêng tư) thay vì xoá hoàn toàn bản gốc.
- **Decision:** Việc xoá file gốc khiến người dùng lo lắng ảnh chất lượng cao của họ bị mất. Lưu lại originalUrl để phục vụ cho tính năng tải ảnh gốc (hoặc cho Tier Subscriber) trong tương lai.

### [06/06] - View Original Artwork Modal
- **Logic:** Thêm hiệu ứng trỏ chuột dạng kính lúp (zoom-in) vào các ảnh trong trang chi tiết Artwork (ArtworkImageGallery.tsx). Sử dụng component Modal của Mantine kết hợp useDisclosure để tạo một giao diện hiển thị ảnh toàn màn hình. Khi người dùng click vào ảnh, hệ thống ưu tiên tải \originalUrl\ (nếu có) hoặc dùng lại \url\ để xem ảnh ở kích thước thật.
- **Decision:** Tái hiện lại trải nghiệm xem ảnh của Pixiv, mang lại cảm giác thân thiện và quen thuộc cho người dùng. Thiết kế thành Modal toàn màn hình giúp người dùng tập trung vào tác phẩm.
