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
