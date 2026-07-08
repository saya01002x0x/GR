# 🎓 CẨM NANG PHẢN BIỆN THẦY KHANG — 30 CÂU HỎI & TRẢ LỜI

> **Đề tài:** Nền tảng chia sẻ và lưu trữ tác phẩm nghệ thuật số tích hợp tìm kiếm đa phương thức
> **Sinh viên:** Hoàng Chí Thanh
> **Phong cách thầy:** Đọc quyển kỹ → Hỏi đúng chức năng trong quyển → Demo live ghi điểm cao hơn video → Hay hỏi "Cái này em tự viết hay dùng của người khác?" → Quan tâm ứng dụng thực tế

> [!CAUTION]
> **ĐÍNH CHÍNH SAI SÓT TỪ CÁC CÂU TRẢ LỜI TRƯỚC:**
> 1. **Sai:** "Phần gợi ý tranh chỉ dùng Lọc cộng tác" → **Đúng:** Dùng Hybrid 4 tầng: CF (60%) + Tag (20%) + Same Author (20%) + Fallback (tranh mới nhất) — xem [artworks.service.ts L529-L643](file:///d:/Khac/Project/GR/backend/src/modules/artworks/artworks.service.ts#L529-L643)
> 2. **Sai:** "Dùng Time-Decay cho Trending" → **Đúng:** `findTrending` dùng `orderBy: [viewCount DESC, likeCount DESC, createdAt DESC]`, KHÔNG có công thức Time-Decay — xem [artworks.service.ts L370-L380](file:///d:/Khac/Project/GR/backend/src/modules/artworks/artworks.service.ts#L370-L380). Riêng `getRanking` mới lọc theo khung thời gian (daily/weekly/monthly) — xem [artworks.service.ts L420-L449](file:///d:/Khac/Project/GR/backend/src/modules/artworks/artworks.service.ts#L420-L449)
> 3. **Sai:** "pHash threshold < 5 bit" → **Đúng:** Hàm `findDuplicates` dùng threshold mặc định = **10**. Chỉ hàm `checkAndReject` (chặn cứng upload) mới dùng threshold = **5** — xem [duplicate-detection.service.ts L48 và L88](file:///d:/Khac/Project/GR/backend/src/modules/duplicate-detection/duplicate-detection.service.ts#L46-L88)
> 4. **Sai:** "Tag trên Meilisearch chỉ có 1 index artworks" → **Đúng:** Em tạo **2 index riêng biệt**: `artworks` (cho tranh) VÀ `tags` (cho autocomplete tag) — xem [search.service.ts L56-L68](file:///d:/Khac/Project/GR/backend/src/modules/search/search.service.ts#L56-L68)

---

## PHẦN 1: LUỒNG UPLOAD & XỬ LÝ ẢNH

---

### Câu 1: "Em mô tả chi tiết luồng upload ảnh đi"
**Trả lời:**
Dạ, luồng upload em thiết kế hoàn toàn **bất đồng bộ**, chia làm 4 bước:
1. **Controller** nhận file multipart + metadata (title, tags, rating, visibility, requiredTierId) — [artworks.controller.ts L326-L340](file:///d:/Khac/Project/GR/backend/src/modules/artworks/artworks.controller.ts#L326-L340)
2. **Service** tạo bản ghi artwork với trạng thái `PROCESSING` vào Postgres, upload file thô lên **MinIO** (Object Storage), và tạo liên kết Tag ngay lúc này (vì Tag là metadata nhẹ, làm đồng bộ cho nhanh) — [artworks.service.ts L165-L263](file:///d:/Khac/Project/GR/backend/src/modules/artworks/artworks.service.ts#L165-L263)
3. **Đẩy Job** vào hàng đợi **BullMQ** với cấu hình retry 3 lần, backoff kiểu exponential (1s, 2s, 4s) — [artworks.service.ts L205-L221](file:///d:/Khac/Project/GR/backend/src/modules/artworks/artworks.service.ts#L205-L221)
4. **Trả HTTP 200** ngay cho user với thông báo "Processing in background" kèm `jobId` để frontend theo dõi tiến trình.

### Câu 2: "Dưới background, worker xử lý những gì?"
**Trả lời:**
Dạ, Worker của BullMQ rút Job ra và chạy tuần tự các tác vụ AI:
1. **Kiểm duyệt NSFW** bằng NSFWJS — dán nhãn tự động nếu phát hiện 18+
2. **Băm nhận thức pHash** bằng thư viện `sharp-phash` — sinh chuỗi nhị phân fingerprint. Sau đó gọi hàm `findDuplicates` so sánh khoảng cách Hamming với tất cả ảnh trong DB. Nếu khoảng cách ≤ 5 → chặn upload (checkAndReject), nếu 5 < khoảng cách ≤ 10 → cảnh báo trùng lặp — [duplicate-detection.service.ts L46-L105](file:///d:/Khac/Project/GR/backend/src/modules/duplicate-detection/duplicate-detection.service.ts#L46-L105)
3. **Sinh vector embedding** bằng model CLIP (chạy trong Child Process riêng `ai-worker.ts`) → lưu vector 512 chiều vào cột `embedding` trên Postgres (pgvector)

### Câu 3: "Tại sao tải ảnh lên phải làm background job mà không làm luôn?"
**Trả lời:**
Dạ vì 3 tác vụ AI (NSFW, pHash, Vector) cực kỳ tốn CPU. Nếu xử lý đồng bộ trên luồng API chính, request sẽ bị timeout (30s+), UI đơ, và nếu 10 người upload cùng lúc thì server sập. Đẩy vào BullMQ giúp:
- User nhận phản hồi ngay (< 2 giây)
- Server chịu tải tốt hơn vì tách biệt luồng phục vụ API và luồng tính toán nặng
- Có cơ chế auto-retry khi lỗi mạng tạm thời (exponential backoff) — [artworks.service.ts L213-L218](file:///d:/Khac/Project/GR/backend/src/modules/artworks/artworks.service.ts#L213-L218)

### Câu 4: "Phần embedding ảnh hưởng gì tới tìm kiếm và xếp hạng mai sau?"
**Trả lời:**
- **Tìm kiếm:** Vector 512 chiều được lưu vào pgvector, phục vụ **Tìm kiếm ngữ nghĩa** (Semantic Search). User gõ "bức tranh buồn" → hệ thống tính khoảng cách Cosine giữa vector câu lệnh và vector các bức tranh → trả về kết quả dù không trùng keyword nào.
- **Xếp hạng/gợi ý tương lai:** Hiện tại module Recommendations dùng Collaborative Filtering (hành vi user). Nhưng nhờ vector đã có sẵn, định hướng tương lai có thể bổ sung **Content-based Recommendation** bằng cách tính khoảng cách Cosine chéo giữa các bức tranh (em đã ghi trong Chương 6 - Hướng phát triển).

### Câu 5: "Mô hình CLIP này em tự viết hay dùng của người khác?"
**Trả lời:**
Dạ em sử dụng mô hình CLIP pre-trained (`Xenova/clip-vit-base-patch32`) qua thư viện `@xenova/transformers` — [ai-worker.ts L1-L8, L21-L25](file:///d:/Khac/Project/GR/backend/src/modules/ai-search/ai-worker.ts#L1-L25). Em **không tự train model**. Đóng góp kỹ thuật của em là:
- **Tích hợp model vào kiến trúc hệ thống thực tế**: Spawn ra một **Child Process** riêng (`fork`) để model AI nặng không block Main Thread của Node.js — [embedding.service.ts L28-L30](file:///d:/Khac/Project/GR/backend/src/modules/ai-search/embedding.service.ts#L28-L30)
- Xử lý **Zombie Process**: Bắt các tín hiệu `SIGINT`, `SIGTERM` để kill worker khi server tắt — [embedding.service.ts L72-L81](file:///d:/Khac/Project/GR/backend/src/modules/ai-search/embedding.service.ts#L72-L81)
- Thiết kế **Request-Response qua IPC** bằng Map chứa Promise pending — [embedding.service.ts L97-L106](file:///d:/Khac/Project/GR/backend/src/modules/ai-search/embedding.service.ts#L97-L106)

---

## PHẦN 2: TÌM KIẾM & KHÁM PHÁ NỘI DUNG

---

### Câu 6: "Hệ thống tìm kiếm của em có mấy cách? Khác nhau thế nào?"
**Trả lời:**
Dạ em thiết kế **2 engine tìm kiếm song song**, phục vụ 2 mục đích khác nhau:
1. **Tìm kiếm Full-text (Meilisearch)** — [search.service.ts](file:///d:/Khac/Project/GR/backend/src/modules/search/search.service.ts): Tìm theo tên tranh, tag, tên tác giả, mô tả. Hỗ trợ typo tolerance (gõ sai vẫn tìm ra), lọc theo rating/ratio/resolution, sắp xếp theo newest/popular.
2. **Tìm kiếm Ngữ nghĩa (pgvector + CLIP)** — [ai-search.service.ts](file:///d:/Khac/Project/GR/backend/src/modules/ai-search/ai-search.service.ts): Tìm bằng câu tự nhiên trừu tượng hoặc bằng **ảnh phác thảo** (Sketch Search). Model CLIP biến câu lệnh/ảnh thành vector → tính Cosine Distance trong Postgres.

### Câu 7: "Tìm kiếm ngữ nghĩa hoạt động chi tiết thế nào?"
**Trả lời:**
Luồng đi qua 3 bước — [ai-search.service.ts L72-L146](file:///d:/Khac/Project/GR/backend/src/modules/ai-search/ai-search.service.ts#L72-L146):
1. **Cache check:** Chuẩn hóa query (lowercase, trim) → kiểm tra Redis với key `search:vector:clip-512:<query>`. Cache TTL = **7 ngày**. Nếu HIT → lấy vector luôn, không cần gọi AI.
2. **Sinh vector (nếu Cache MISS):** Gửi text xuống `EmbeddingService` → chuyển tiếp sang `ai-worker` (Child Process chạy model CLIP) → nhận về mảng 512 số thực → lưu vào Redis.
3. **Truy vấn pgvector:** Chạy Raw SQL dùng toán tử `<=>` (Cosine Distance). Câu SQL dùng CTE `DISTINCT ON (artwork_id)` để mỗi bức tranh chỉ trả về ảnh gần nhất. Lọc bỏ kết quả có similarity < 0.25 (TEXT_MIN_SIMILARITY).

### Câu 8: "Em cũng có tìm kiếm bằng ảnh phác thảo (Sketch)?"
**Trả lời:**
Dạ đúng ạ. Hàm `searchBySketch` — [ai-search.service.ts L152](file:///d:/Khac/Project/GR/backend/src/modules/ai-search/ai-search.service.ts#L152) — nhận ảnh base64 từ frontend, gọi `getImageEmbedding` trong `EmbeddingService` để CLIP Vision Model sinh vector từ ảnh, rồi query pgvector tương tự text search. Tính năng này chỉ dành cho user Premium (có rate limit riêng).

### Câu 9: "Tại sao tìm kiếm ngữ nghĩa đôi khi không chính xác?"
**Trả lời:**
Dạ có 3 giới hạn kỹ thuật:
1. **Domain gap:** CLIP base được train trên dữ liệu thế giới thực (LAION), chưa fine-tune cho miền "Nghệ thuật số / Anime" nên hiểu hạn chế các phong cách vẽ ngách.
2. **Mất chi tiết:** Input ảnh bị resize xuống 224x224 pixel để model nuốt → chi tiết nhỏ bị mất trong quá trình nén thành 512 chiều.
3. **Kích thước model:** Bản `vit-base-patch32` là model nhẹ (512 chiều) để chạy local, không sâu bằng model enterprise 1536 chiều.

👉 **Giải pháp:** Em thiết kế **Tìm kiếm Lai (Hybrid)** — Meilisearch đảm bảo tìm chính xác 100% theo keyword, còn Semantic Search chỉ đóng vai trò "Khám phá mở rộng" cho truy vấn cảm xúc.

### Câu 10: "Về phần Tag trên Meilisearch, em tối ưu thế nào?"
**Trả lời:**
Dạ em tạo **2 index riêng biệt** trên Meilisearch — [search.service.ts L56-L68](file:///d:/Khac/Project/GR/backend/src/modules/search/search.service.ts#L56-L68):
1. **Index `artworks`:** Mỗi Document chứa mảng `tags: string[]`. Em đặt Tag vào cả `searchableAttributes` (gõ tag tìm ra tranh) lẫn `filterableAttributes` (lọc Faceted Search). Ranking rules tùy chỉnh: ưu tiên `words > typo > proximity > attribute > sort > exactness > likeCount:desc > viewCount:desc` — [search.service.ts L100-L130](file:///d:/Khac/Project/GR/backend/src/modules/search/search.service.ts#L100-L130)
2. **Index `tags`:** Riêng cho **autocomplete** khi user gõ tag lúc upload. Mỗi Document gồm `{name, count}`. Sắp xếp theo `count:desc` để tag phổ biến nhất hiện đầu — [search.service.ts L136-L157](file:///d:/Khac/Project/GR/backend/src/modules/search/search.service.ts#L136-L157)

### Câu 11: "Tại sao luồng Upload không đồng bộ sang Meilisearch luôn?"
**Trả lời:**
Dạ vì kiến trúc Event-Driven. Lúc upload, tranh đang ở trạng thái `PROCESSING` (AI đang quét NSFW, pHash). Nếu đồng bộ Meilisearch ngay → tranh "rác" (chưa qua kiểm duyệt) sẽ xuất hiện trên thanh tìm kiếm. Chỉ khi Worker xử lý xong, tranh chuyển sang `PUBLISHED`, module `MeilisearchSyncService` mới bắt sự kiện để đồng bộ — [meilisearch-sync.service.ts](file:///d:/Khac/Project/GR/backend/src/modules/stats/meilisearch-sync.service.ts)

---

## PHẦN 3: XẾP HẠNG & GỢI Ý TRANH

---

### Câu 12: "Phần Trending/Ranking trên trang Discover, em thiết kế thế nào?"
**Trả lời:**
Dạ em chia thành nhiều endpoint riêng biệt — [artworks.controller.ts L96-L149](file:///d:/Khac/Project/GR/backend/src/modules/artworks/artworks.controller.ts#L96-L149):
- **`GET /artworks/popular`** (Trending): Sắp xếp theo `viewCount DESC → likeCount DESC → createdAt DESC`. Đơn giản nhưng hiệu quả vì viewCount và likeCount đã được tổng hợp sẵn bởi BullMQ — [artworks.service.ts L370-L380](file:///d:/Khac/Project/GR/backend/src/modules/artworks/artworks.service.ts#L370-L380)
- **`GET /artworks/ranking?timeframe=daily|weekly|monthly|rookie`**: Lọc tranh theo **khung thời gian** (createdAt >= X ngày trước), rồi sắp theo `likeCount DESC → viewCount DESC`. Đây chính là cơ chế "nhường chỗ" cho tranh mới — tranh cũ tự rớt khỏi bảng xếp hạng khi hết khung thời gian — [artworks.service.ts L420-L449](file:///d:/Khac/Project/GR/backend/src/modules/artworks/artworks.service.ts#L420-L449)
- **`GET /artworks/discover/hero`**: Lấy top 3 tranh (ưu tiên tranh Promoted), gán nhãn Spotlight / Staff Pick / Tutorial — [artworks.service.ts L382-L401](file:///d:/Khac/Project/GR/backend/src/modules/artworks/artworks.service.ts#L382-L401)
- **`GET /artworks/discover/featured`**: Lấy tranh đang được quảng bá (isPromoted = true, promotedUntil > now) — [artworks.service.ts L404-L418](file:///d:/Khac/Project/GR/backend/src/modules/artworks/artworks.service.ts#L404-L418)
- **`GET /artworks/rising-stars`**: Lấy top họa sĩ mới nổi theo số tác phẩm và followers — [artworks.service.ts L452-L489](file:///d:/Khac/Project/GR/backend/src/modules/artworks/artworks.service.ts#L452-L489)

### Câu 13: "Phần gợi ý tranh liên quan (Related), em dùng thuật toán gì?"
**Trả lời:**
Dạ em dùng **Hybrid Recommendation 4 tầng** với cơ chế fallback tự động — comment trong code ghi rõ — [artworks.service.ts L529-L643](file:///d:/Khac/Project/GR/backend/src/modules/artworks/artworks.service.ts#L529-L643):

| Tầng | Tỷ lệ | Nguồn | Mô tả |
|------|--------|-------|-------|
| 1 | **60%** | Collaborative Filtering | "User thích tranh này cũng thích tranh kia" — gọi `RecommendationsService` |
| 2 | **20%** | Matching Tags | Tranh có chung tag với tranh hiện tại |
| 3 | **20%** | Same Author | Tranh khác cũng do họa sĩ đó vẽ |
| 4 | **Fallback** | Tranh mới nhất | Nếu 3 tầng trên không đủ số lượng → lấy tranh mới nhất để lấp đầy |

**Điểm hay:** Nếu tầng CF chỉ tìm được 3/6 tranh (thiếu 3), ngân sách thiếu đó sẽ được **chuyển tiếp** sang tầng Tag (`remainingTagLimit = tagLimit + (cfLimit - cfArtworks.length)`) — [artworks.service.ts L575](file:///d:/Khac/Project/GR/backend/src/modules/artworks/artworks.service.ts#L575). Tương tự, nếu Tag cũng thiếu thì chuyển tiếp cho Author — [artworks.service.ts L600](file:///d:/Khac/Project/GR/backend/src/modules/artworks/artworks.service.ts#L600). Thiết kế này giúp vùng gợi ý **không bao giờ bị trống**.

### Câu 14: "Collaborative Filtering trong code em hoạt động cụ thể ra sao?"
**Trả lời:**
Dạ em triển khai **2 loại** CF trong [recommendations.service.ts](file:///d:/Khac/Project/GR/backend/src/modules/recommendations/recommendations.service.ts):
1. **Item-based** (`getRecommendations`, L39): Câu SQL dùng CTE `similar_users` tìm tất cả user đã tương tác với bức tranh hiện tại → JOIN ngược lại bảng `user_interactions` để tìm tranh khác mà nhóm user đó cũng tương tác → tính `SUM(weight)` làm `match_score` → sắp xếp DESC.
2. **User-based** (`getPersonalizedRecommendations`, L90): Tìm user có hành vi giống user hiện tại (dựa trên overlap bức tranh) → tính `affinity` score → lấy top 50 user giống nhất → tìm tranh mà nhóm user đó thích nhưng user hiện tại **chưa** xem (`NOT IN user_artworks`).

Cả 2 đều được **cache Redis** với TTL = 3600s (1 giờ). Và có hàm `invalidateCache` để xóa cache khi có tương tác mới quan trọng — [recommendations.service.ts L147-L151](file:///d:/Khac/Project/GR/backend/src/modules/recommendations/recommendations.service.ts#L147-L151).

---

## PHẦN 4: THANH TOÁN & BẢO MẬT NỘI DUNG TRẢ PHÍ

---

### Câu 15: "Luồng thanh toán hội viên em làm thế nào?"
**Trả lời:**
Dạ nguyên tắc là **tuyệt đối không lưu thẻ tín dụng** trong hệ thống em. Luồng đi qua 3 bước:
1. **Tạo Checkout Session:** Khi user chọn gói, backend gọi `stripe.checkout.sessions.create` với `mode: 'subscription'` → Stripe trả về URL → redirect user sang trang Stripe nhập thẻ — [stripe.service.ts L26-L75](file:///d:/Khac/Project/GR/backend/src/modules/payments/stripe.service.ts#L26-L75)
2. **Webhook xử lý callback:** Khi thanh toán xong, Stripe bắn POST request về `/webhook/stripe`. Em **verify chữ ký** bằng `constructWebhookEvent(payload, signature)` sử dụng `STRIPE_WEBHOOK_SECRET` — [stripe.service.ts L197-L199](file:///d:/Khac/Project/GR/backend/src/modules/payments/stripe.service.ts#L197-L199), [webhook.controller.ts L46-L56](file:///d:/Khac/Project/GR/backend/src/modules/payments/webhook.controller.ts#L46-L56)
3. **Cập nhật DB:** Sau khi verify thành công, `handleStripeSubscriptionUpdate` cập nhật trạng thái subscription (ACTIVE/CANCELED/EXPIRED/PAST_DUE) và `current_period_end` vào Postgres — [payments.service.ts L20-L35](file:///d:/Khac/Project/GR/backend/src/modules/payments/payments.service.ts#L20-L35)

### Câu 16: "Em xử lý mấy loại Webhook event?"
**Trả lời:**
Dạ em xử lý **4 event** chính — [webhook.controller.ts L58-L133](file:///d:/Khac/Project/GR/backend/src/modules/payments/webhook.controller.ts#L58-L133):
- `checkout.session.completed`: Thanh toán thành công (có check thêm nếu là promote artwork thì xử lý riêng)
- `invoice.paid`: Hóa đơn đã trả (cho subscription gia hạn tự động)
- `customer.subscription.updated`: Cập nhật khi user thay đổi gói
- `customer.subscription.deleted`: Hủy subscription

### Câu 17: "Đảm bảo chỉ người trả phí mới nhìn được tranh — em làm thế nào?"
**Trả lời:**
Dạ em xử lý ở tầng **Backend Authorization** chứ không chỉ giấu nút ở Frontend.

Khi artwork có `visibility = TIER_GATED` và `requiredTierId` khác null, hệ thống gọi hàm `getArtworkAccess` — [artworks.service.ts L724-L757](file:///d:/Khac/Project/GR/backend/src/modules/artworks/artworks.service.ts#L724-L757):
1. Nếu viewer là **chủ sở hữu** (authorId === viewerId) → `canViewFull = true`
2. Nếu tranh `PUBLIC` → `canViewFull = true` 
3. Nếu tranh `TIER_GATED` → gọi `getExpandedAccessibleTierIds(viewerId)` để lấy danh sách tier mà user đã mua → check xem `requiredTierId` có nằm trong Set đó không
4. Nếu **không có quyền** → `canViewFull = false`, API trả `NotFoundException` (không trả link ảnh gốc)

Trong phần Discover/Related, hàm `filterAccessibleArtworks` — [artworks.service.ts L659-L674](file:///d:/Khac/Project/GR/backend/src/modules/artworks/artworks.service.ts#L659-L674) — lọc bỏ hoàn toàn các tranh gated mà user chưa mua, đảm bảo không lọt link ảnh gốc ra ngoài.

### Câu 18: "Hệ thống em có mấy loại thanh toán?"
**Trả lời:**
Dạ em thiết kế **3 loại** — xem [stripe.service.ts](file:///d:/Khac/Project/GR/backend/src/modules/payments/stripe.service.ts):
1. **Platform Subscription** (`createCheckoutSession`): User mua gói nền tảng, metadata ghi `type: 'PLATFORM'`
2. **Artist Tier Subscription** (`createTierCheckoutSession`): Fan đăng ký gói hội viên của riêng từng họa sĩ, metadata ghi `type: 'ARTIST_TIER'` kèm `artistId` và `tierId`
3. **One-time Payment** (`createOneTimeCheckoutSession`): Thanh toán một lần (ví dụ: Promote artwork lên Featured), `mode: 'payment'` thay vì `'subscription'`

### Câu 19: "Phần hoa hồng (commission) em xử lý thế nào?"
**Trả lời:**
Dạ em cấu hình `commissionRate = 0.1` (10%) — [payments.service.ts L17](file:///d:/Khac/Project/GR/backend/src/modules/payments/payments.service.ts#L17). Khi fan trả tiền cho gói Artist Tier, hệ thống tính doanh thu thực cho họa sĩ = 90% sau khi trừ hoa hồng nền tảng.

---

## PHẦN 5: CACHE, HIỆU NĂNG & KIẾN TRÚC

---

### Câu 20: "Em có dùng cache gì cho nhẹ backend không?"
**Trả lời:**
Dạ em dùng **Redis** làm cache ở 3 điểm chiến lược:
1. **Cache kết quả gợi ý** (Recommendations): TTL = 1 giờ. Câu SQL tính score rất nặng, nhưng nhờ cache, hàng ngàn user vào xem cùng 1 tranh chỉ tính 1 lần — [recommendations.service.ts L44-L50](file:///d:/Khac/Project/GR/backend/src/modules/recommendations/recommendations.service.ts#L44-L50)
2. **Write-Buffer cho View**: Mỗi lượt view chỉ `INCR` vào Redis. Worker dùng `GETDEL` gom batch rồi flush 1 lần vào Postgres — [view.service.ts L67-L68](file:///d:/Khac/Project/GR/backend/src/modules/stats/view.service.ts#L67-L68), [stats.processor.ts L52-L53](file:///d:/Khac/Project/GR/backend/src/modules/stats/stats.processor.ts#L52-L53)
3. **Cache vector embedding AI**: TTL = **7 ngày**. Câu tìm kiếm "cô gái buồn" chỉ cần gọi CLIP 1 lần → lưu vector vào Redis → 7 ngày sau ai tìm lại cũng lấy từ cache — [ai-search.service.ts L86-L116](file:///d:/Khac/Project/GR/backend/src/modules/ai-search/ai-search.service.ts#L86-L116)

### Câu 21: "View spam thì sao? Một user refresh liên tục để tăng view?"
**Trả lời:**
Dạ em có cơ chế **Spam Protection** bằng Redis — [view.service.ts L39-L64](file:///d:/Khac/Project/GR/backend/src/modules/stats/view.service.ts#L39-L64):
- Khi có view, em tạo lock key `view_lock:<artworkId>:<userId hoặc IP>` với lệnh `SET NX EX 600` (TTL = 10 phút)
- `NX` = chỉ set nếu key chưa tồn tại. Nếu key đã có → trả về `false` → không đếm view
- Tức 1 user/IP chỉ được tính **1 view mỗi 10 phút** cho mỗi bức tranh

### Câu 22: "Bộ đếm bất đồng bộ (Like/View) có bị lệch (drift) không? Em xử lý thế nào?"
**Trả lời:**
Dạ vì em cập nhật counter bất đồng bộ nên có thể bị drift nhẹ (ví dụ: job fail, Redis mất dữ liệu). Em thiết kế một **Reconciliation Cron Job** chạy mỗi ngày lúc **3 giờ sáng** — [reconciliation.task.ts](file:///d:/Khac/Project/GR/backend/src/modules/stats/reconciliation.task.ts):
- Quét tất cả artwork đã Published theo batch (100/lần)
- `COUNT(*)` thực tế từ bảng `likes` và `comments` (source of truth)
- So sánh với giá trị `likeCount`/`commentCount` đang lưu trên bảng `artworks`
- Nếu lệch → UPDATE Postgres + đồng bộ sang Meilisearch
- Comment code ghi rõ: *"Daily cron job at 3:00 AM to fix counter drift"*

### Câu 23: "Kiến trúc Modular Monolith + Event-Driven em thiết kế thế nào?"
**Trả lời:**
Dạ backend em chia thành **20 module** độc lập trong thư mục `modules/` (artworks, search, ai-search, payments, likes, comments, follows, notifications, recommendations, stats, queue, ...). Các module không import service của nhau trực tiếp mà giao tiếp qua **EventEmitter2** (Event Bus nội bộ).

Ví dụ cụ thể: Khi user Like tranh — [likes.service.ts L127](file:///d:/Khac/Project/GR/backend/src/modules/likes/likes.service.ts#L127):
```typescript
this.eventEmitter.emit('artwork.liked', { authorId, artworkId, artworkTitle, user });
```
Module Likes chỉ phát event → Module Notifications lắng nghe event này để gửi thông báo → Module Stats lắng nghe để cập nhật counter. Không có import chéo nào.

### Câu 24: "Sao không làm Microservices luôn?"
**Trả lời:**
Dạ với quy mô sinh viên và tài nguyên VPS hạn chế, Microservices sẽ gây overhead lớn (trễ mạng giữa các service, phức tạp deploy, khó debug). Modular Monolith cho em lợi thế: chạy trên 1 process duy nhất (tiết kiệm RAM/CPU), nhưng ranh giới module rõ ràng tuyệt đối (zero circular dependency). Nếu sau này cần scale, em chỉ cần "nhấc" 1 module ra thành service riêng mà không phải refactor code vì giao tiếp đã đi qua Event Bus.

---

## PHẦN 6: KIỂM DUYỆT & BẢO VỆ BẢN QUYỀN

---

### Câu 25: "Thuật toán pHash hoạt động chi tiết thế nào?"
**Trả lời:**
Dạ pHash sinh "dấu vân tay" cho ảnh qua 4 bước: Thu nhỏ → Chuyển grayscale → Biến đổi DCT (Discrete Cosine Transform) → Tạo chuỗi nhị phân. Em dùng thư viện `sharp-phash` — [duplicate-detection.service.ts L9-L10](file:///d:/Khac/Project/GR/backend/src/modules/duplicate-detection/duplicate-detection.service.ts#L9-L10). So sánh dùng hàm `dist` (Hamming Distance) — đếm số bit khác biệt giữa 2 hash.

**Em có 2 mức ngưỡng:**
- `threshold = 5` trong `checkAndReject`: Chặn cứng upload nếu ảnh gần như giống hệt (resize, crop nhẹ, đổi format)
- `threshold = 10` trong `findDuplicates`: Cảnh báo (warn) cho hệ thống/admin review

### Câu 26: "Hệ thống tự duyệt ảnh NSFW rồi, sao cần admin?"
**Trả lời:**
Dạ AI (NSFWJS và pHash) chỉ đóng vai trò **pre-filter tự động** để giảm tải. Tuy nhiên AI có thể bắt nhầm (False Positive) hoặc bỏ sót (False Negative). Nghiệp vụ thực tế luôn cần con người (Admin) can thiệp ở bước cuối cùng khi có tranh chấp (Report) để đảm bảo công bằng cho họa sĩ. Em gọi đây là kiến trúc "Kiểm duyệt bán tự động" (Semi-automated Moderation).

---

## PHẦN 7: CÂU HỎI NGHIỆP VỤ & ỨNG DỤNG THỰC TẾ

---

### Câu 27: "Motivation của hệ thống này là gì? Sao không dùng Facebook, DeviantArt?"
**Trả lời:**
Dạ các nền tảng hiện tại bị **phân tán chức năng**: Facebook không bảo vệ bản quyền, DeviantArt không có tìm kiếm ngữ nghĩa, Patreon tách rời khỏi nơi người dùng khám phá tác phẩm. Hệ thống của em tích hợp trong cùng 1 nền tảng: Upload + Kiểm duyệt bản quyền tự động + Tìm kiếm AI + Membership thanh toán. Họa sĩ không cần dùng 4-5 dịch vụ khác nhau.

### Câu 28: "Hệ thống em có khả năng mở rộng thực tế không?"
**Trả lời:**
Dạ có, nhờ kiến trúc Modular Monolith + Queue:
- **Tách service:** Nếu lượng tìm kiếm AI tăng đột biến, em chỉ cần tách module `ai-search` ra thành microservice riêng, scale horizontal bằng cách thêm nhiều instance Worker
- **Scale Queue:** BullMQ chạy trên Redis hỗ trợ thêm nhiều Worker consumer song song (`concurrency: 5` hiện tại có thể tăng)
- **Scale Storage:** MinIO hỗ trợ distributed mode
- **Scale Search:** Meilisearch hỗ trợ multi-node clustering

### Câu 29: "Em có viết test không?"
**Trả lời:**
Dạ em có viết unit test cho các service cốt lõi bằng Jest (framework test mặc định của NestJS) — ví dụ [artworks.service.spec.ts](file:///d:/Khac/Project/GR/backend/src/modules/artworks/artworks.service.spec.ts). Nhờ kiến trúc Modular Monolith, khi test 1 module em chỉ cần mock các dependency (PrismaService, Queue, EventEmitter) mà không cần khởi động toàn bộ hệ thống.

### Câu 30: "Hạn chế và hướng phát triển?"
**Trả lời:**
Dạ em xin nêu 3 hạn chế chính:
1. **Module Recommendations chưa có Content-based:** Em đã có vector sẵn trong pgvector nhưng chưa kịp viết hàm tính Cosine Distance chéo giữa các bức tranh để gợi ý theo nét vẽ/phong cách tương đồng. Định hướng tương lai chỉ cần query pgvector lấy K-nearest vectors.
2. **CLIP model chưa fine-tune cho Digital Art:** Nếu thu thập được dataset nghệ thuật số đủ lớn, có thể fine-tune lại model để cải thiện chất lượng tìm kiếm ngữ nghĩa.
3. **Chưa có giải quyết tranh chấp bản quyền tự động:** Hiện tại pHash chỉ phát hiện trùng lặp, nhưng quy trình khiếu nại vẫn phụ thuộc hoàn toàn vào Admin review thủ công.

---

## PHẦN 8: CACHE FRONTEND & TỐI ƯU API

---

### Câu 31: "Client gọi API liên tục mỗi lần chuyển trang à? Em có tối ưu cache frontend không?"
**Trả lời:**
Dạ không ạ. Ở Frontend em sử dụng thư viện **React Query** (`@tanstack/react-query`) kết hợp với Axios/Fetch API để quản lý state và cache toàn cục — [QueryProvider.tsx L8-L21](file:///d:/Khac/Project/GR/frontend/src/libs/QueryProvider.tsx#L8-L21).
Em cấu hình 2 tham số quan trọng:
- `gcTime` (Garbage Collection): **10 phút**. Dữ liệu không còn hiển thị trên màn hình sẽ vẫn nằm trong RAM 10 phút trước khi bị xóa, giúp user bấm "Back" lại trang cũ không bị loading.
- `staleTime`: Tùy chỉnh theo từng hook. Ví dụ: Các feed tĩnh như Trang chủ (Discover/Trending) em để `staleTime = 15 phút` — [useDiscover.ts L28](file:///d:/Khac/Project/GR/frontend/src/api/hooks/useDiscover.ts#L28). Nhưng với các dữ liệu cần realtime cao như Follow, Notification em để `staleTime = 1 phút` — [use-follow.ts L31](file:///d:/Khac/Project/GR/frontend/src/api/hooks/use-follow.ts#L31).

Nhờ kiến trúc này, 80% tác vụ lướt web thông thường đọc thẳng từ RAM của trình duyệt mà không gọi API tới backend, tiết kiệm băng thông và giảm tải server rất nhiều.

---

## PHẦN 9: PHÂN QUYỀN (RBAC) & BẢO MẬT

---

### Câu 32: "Hệ thống em phân quyền (Authorization) thế nào? Lỡ user gọi API xóa tranh thì sao?"
**Trả lời:**
Dạ em triển khai hệ thống **Role-Based Access Control (RBAC)** thông qua Custom Guard của NestJS — [roles.guard.ts L18-L65](file:///d:/Khac/Project/GR/backend/src/common/guards/roles.guard.ts#L18-L65).
Em định nghĩa `ROLE_HIERARCHY` gồm 4 cấp: `USER (0) < MODERATOR (1) < ADMIN (2) < SUPER_ADMIN (3)`.
Khi gọi API:
1. Controller đánh dấu bằng Decorator, ví dụ `@Roles('MODERATOR')`
2. `RolesGuard` dùng NestJS Reflector đọc metadata này
3. So sánh `userLevel >= requiredLevel`. Nếu user thường gọi API của Moderator, Guard sẽ chặn ngay ở vòng ngoài (trả về 403 Forbidden) trước khi chạm vào Logic Service.

Ngoài ra, `RolesGuard` cũng check thuộc tính `isBanned` của user, chặn mọi request từ tài khoản bị khóa ngay lập tức.

---

## PHẦN 10: KIỂM DUYỆT BÁO CÁO (REPORT) & AUTO-UNBAN

---

### Câu 33: "Khi có người report 1 bức tranh, quy trình xử lý của Moderator diễn ra thế nào?"
**Trả lời:**
Dạ quy trình xử lý báo cáo có 2 chiều — [admin.service.ts L374-L442](file:///d:/Khac/Project/GR/backend/src/modules/admin/admin.service.ts#L374-L442):
- **Trường hợp Moderator bác bỏ report (Approve):** Hệ thống đánh dấu report thành `DISMISSED` và giữ nguyên trạng thái tranh.
- **Trường hợp Moderator đồng ý report (Reject):** Hệ thống chạy 1 Transaction lớn cập nhật DB:
  1. Ẩn bức tranh (`status = HIDDEN`)
  2. Tạo 1 bản ghi cảnh cáo (`UserWarning`) cho tác giả
  3. Tăng `warningCount` của user đó lên 1
  4. Đánh dấu report thành `RESOLVED`.

### Câu 34: "Cảnh cáo bao nhiêu lần thì bị ban? Ban vĩnh viễn hay tạm thời?"
**Trả lời:**
Dạ em thiết kế cơ chế **Ban tạm thời leo thang** — [admin.service.ts L430-L450](file:///d:/Khac/Project/GR/backend/src/modules/admin/admin.service.ts#L430-L450):
Khi `warningCount >= MAX_WARNINGS_BEFORE_BAN`, hệ thống tự động thiết lập `isBanned = true` và `bannedUntil = now + 7 ngày` (Temp Ban). 
Nếu tài khoản vi phạm cực kỳ nghiêm trọng, Admin có quyền ban thủ công (Permaban) mà không cần thời hạn.

### Câu 35: "Thế hết 7 ngày ai là người mở khóa (Unban) cho họ?"
**Trả lời:**
Dạ hệ thống **mở khóa tự động**. Em viết một Cron Job `AutoUnbanTask` chạy ngầm mỗi giờ một lần — [auto-unban.task.ts L21-L61](file:///d:/Khac/Project/GR/backend/src/modules/admin/auto-unban.task.ts#L21-L61).
Task này sẽ quét bảng User, tìm những ai `isBanned = true` và `bannedUntil <= now`. Nếu thỏa mãn, nó sẽ:
1. Đặt lại `isBanned = false`
2. Bắn 1 Notification cảnh báo: "Lệnh cấm tạm thời của bạn đã hết hạn... hãy tuân thủ quy tắc cộng đồng để tránh bị cấm vĩnh viễn".
Điều này giúp giảm hoàn toàn công sức vận hành của Admin.

### Câu 36: "Tác giả có quyền khiếu nại (Appeal) không?"
**Trả lời:**
Dạ có ạ. Khi tranh bị AI chặn (ví dụ dính NSFW hoặc Duplicate) và bị chuyển sang trạng thái `ACTION_REQUIRED`, tác giả có thể bấm "Kháng cáo". Khi đó, thay vì tạo report từ người ngoài, hệ thống dùng chính module Report, ghi nhận `reporterId == authorId` và tự động đổi trạng thái tranh thành `IN_REVIEW` để Admin xem xét lại bằng mắt thường — [reports.service.ts L36-L64](file:///d:/Khac/Project/GR/backend/src/modules/reports/reports.service.ts#L36-L64).

---

> [!TIP]
> **Lời khuyên cuối:**
> - Bật sẵn Docker/Server chạy mượt trước khi thầy vào
> - Demo live theo luồng: Upload → Xem trạng thái Processing → Tìm kiếm (Meilisearch + Semantic) → Like → Xem Related → Thanh toán Stripe
> - Khi thầy hỏi, nhớ công thức: **Nghiệp vụ → Luồng kiến trúc → Trade-off (tại sao chọn cách này)**
> - Thành thật về AI: "Em dùng model pre-trained, đóng góp của em là tích hợp vào kiến trúc hệ thống"
