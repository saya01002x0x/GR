# 📚 NestJS Knowledge Guide

Tổng hợp các khái niệm NestJS đã sử dụng trong dự án.

---

#### BullMQ Queue (Background Jobs)
- **Là gì:** Hệ thống hàng đợi (queue) để xử lý công việc bất đồng bộ. BullMQ dùng Redis làm backend.
- **Cách dùng:**
  ```typescript
  // Đăng ký queue trong module
  BullModule.registerQueue({ name: 'stats-queue' });
  
  // Inject và thêm job
  @InjectQueue('stats-queue') private readonly queue: Queue;
  await this.queue.add('job-name', { data }, { jobId: 'unique-id' });
  
  // Processor xử lý job
  @Processor('stats-queue')
  export class MyProcessor extends WorkerHost {
    async process(job: Job) { /* xử lý */ }
  }
  ```
- **Ứng dụng:** Dùng cho counter update (view/like/comment) để giảm latency user request. Job chạy background, không block response.

---

#### @nestjs/schedule (Cron Jobs)
- **Là gì:** Module hỗ trợ lập lịch chạy task tự động (cron jobs, intervals).
- **Cách dùng:**
  ```typescript
  // Import ScheduleModule.forRoot() 1 LẦN DUY NHẤT ở AppModule
  ScheduleModule.forRoot()
  
  // Dùng @Cron decorator
  @Cron('0 3 * * *')  // Chạy lúc 3:00 AM hàng ngày
  async handleTask() { /* logic */ }
  
  @Cron('*/5 * * * * *')  // Mỗi 5 giây
  async handleInterval() { /* logic */ }
  ```
- **Ứng dụng:** ReconciliationTask (3AM sửa counter drift), MeilisearchSyncService (flush buffer mỗi 5s), AutoUnbanTask (mỗi giờ mở ban hết hạn).

---

#### Redis Injection (Custom Provider)
- **Là gì:** Tạo provider tùy chỉnh để inject ioredis client vào bất kỳ service nào.
- **Cách dùng:**
  ```typescript
  // Định nghĩa token
  export const REDIS_CLIENT = 'REDIS_CLIENT';
  
  // Provider factory trong module
  { provide: REDIS_CLIENT, useFactory: (config) => new Redis({...}), inject: [ConfigService] }
  
  // Inject vào service
  @Inject(REDIS_CLIENT) private readonly redis: Redis;
  ```
- **Ứng dụng:** Dùng chung Redis connection cho ViewService (spam lock, view count), MeilisearchSyncService (buffer hash), StatsProcessor (GETDEL).

---

#### Meilisearch Partial Update
- **Là gì:** Cập nhật chỉ một số trường của document trong Meilisearch mà không cần gửi lại toàn bộ document.
- **Cách dùng:**
  ```typescript
  // Chỉ cập nhật likeCount, viewCount — các trường khác giữ nguyên
  await index.updateDocuments([
    { id: 'artwork-123', likeCount: 42, viewCount: 100 }
  ]);
  ```
- **Ứng dụng:** Dùng trong MeilisearchSyncService để chỉ cập nhật stats khi Like/View/Comment thay đổi. Tránh full re-index.

---

#### Fire-and-Forget Pattern
- **Là gì:** Gọi async function nhưng không `await` kết quả. Dùng `.catch(() => {})` để nuốt lỗi.
- **Cách dùng:**
  ```typescript
  // Không block response
  this.viewService.recordView(id, userId, ip).catch(() => {});
  ```
- **Ứng dụng:** View tracking trong ArtworksController — ghi view không block response trả về artwork data.

---

#### Optimistic Response
- **Là gì:** Trả về kết quả dự đoán ngay lập tức cho client, trước khi server xử lý xong hoàn toàn.
- **Cách dùng:**
  ```typescript
  // Trả về count ± 1 ngay, DB sẽ cập nhật async sau
  return { liked: true, likeCount: currentCount + 1 };
  ```
- **Ứng dụng:** Like/Unlike toggle — client nhận ngay likeCount mới (optimistic), counter thực sự được update bất đồng bộ qua BullMQ.

---

#### Interceptors (AOP - Aspect Oriented Programming)
- **Là gì:** Khối logic để chặn (intercept) request/response trước và sau khi nó được xử lý bởi handler (Controller), hữu ích cho logging, mapping, caching, error handling.
- **Cách dùng:**
  ```typescript
  import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { tap } from 'rxjs/operators';

  @Injectable()
  export class AuditLogInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest();
      return next.handle().pipe(
        tap(() => {
          // Xử lý sau khi controller đã return thành công
          console.log(`Log method: ${request.method}`);
        }),
      );
    }
  }

  // Dùng ở Controller
  @UseInterceptors(AuditLogInterceptor)
  @Controller('admin')
  export class AdminController {}
  ```
- **Ứng dụng:** `AuditLogInterceptor` tự động ghi nhận lại mọi request POST/PUT/PATCH/DELETE từ Admin/Moderator vào Database mà không cần nhúng rườm rà `auditLogService` ở từng route method một.

---

#### Guards (Bảo vệ Route)
- **Là gì:** Lớp (class) dùng để kiểm tra quyền truy cập của request trước khi vào Controller.
- **Cách dùng:**
  ```typescript
  @UseGuards(ClerkGuard)
  @Get('me')
  getMe() {}
  ```
- **Ứng dụng:** `ClerkGuard` xác thực Clerk JWT token và cho phép truy cập nếu hợp lệ.

---

#### Custom Decorators (Param Decorators)
- **Là gì:** Tạo decorator riêng để trích xuất dữ liệu từ request object gọn gàng hơn.
- **Cách dùng:**
  ```typescript
  export const CurrentUser = createParamDecorator((data, ctx) => {
    return ctx.switchToHttp().getRequest().user;
  });
  ```
- **Ứng dụng:** `@CurrentUser()` lấy nhanh thông tin user hiện tại từ request.

---

#### Sharp (Server-side Image Processing)
- **Là gì:** Thư viện xử lý ảnh siêu tốc độ cho Node.js (dựa trên libvips).
- **Cách dùng:**
  ```typescript
  import * as sharp from 'sharp';

  // Resize và làm mờ ảnh (Blur)
  const blurredBuffer = await sharp(imageBuffer)
    .resize(400, 400, { fit: 'inside' })
    .blur(30)
    .jpeg({ quality: 50 })
    .toBuffer();
  ```
- **Ứng dụng:** Dùng trong `StorageService` và `ArtworkProcessor` để tự động tạo bản preview bị làm mờ (blurred preview) cho các ảnh thuộc Tier trả phí (Tier-gated artworks), giúp bảo vệ nội dung gốc khỏi việc bị trích xuất thông qua Client-side DevTools.

---

#### OnModuleInit (Lifecycle Hook)
- **Là gì:** Interface lifecycle của NestJS, cho phép chạy logic khởi tạo sau khi module đã được resolve xong tất cả dependencies.
- **Cách dùng:**
  ```typescript
  @Injectable()
  export class MyService implements OnModuleInit {
    async onModuleInit() {
      // Khởi tạo SDK, kết nối external service, v.v.
      this.client = new ExternalSDK({ apiKey: this.config.get('API_KEY') });
    }
  }
  ```
- **Ứng dụng:** `EmbeddingService` dùng `onModuleInit` để khởi tạo Google Gemini SDK với API key từ ConfigService. Nếu key chưa set, service log warning và disable AI Search thay vì crash app.

---

#### Google Gemini Embedding API (@google/genai)
- **Là gì:** SDK chính thức của Google để gọi Gemini AI API, hỗ trợ tạo vector embedding từ text và image (multimodal).
- **Cách dùng:**
  ```typescript
  import { GoogleGenAI } from '@google/genai';

  const genai = new GoogleGenAI({ apiKey: 'YOUR_KEY' });

  // Text embedding
  const res = await genai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: 'search query',
    config: { taskType: 'SEMANTIC_SIMILARITY' },
  });
  const vector = res.embeddings[0].values; // number[768]

  // Image embedding (multimodal)
  const res2 = await genai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: { parts: [{ inlineData: { mimeType: 'image/png', data: base64 } }] },
  });
  ```
- **Ứng dụng:** `EmbeddingService` dùng Gemini để tạo vector 768 chiều cho text search (người dùng nhập câu hỏi) và sketch search (người dùng vẽ phác thảo). Vector này được lưu vào pgvector để tìm kiếm ngữ nghĩa.

---

#### pgvector Raw SQL ($queryRawUnsafe)
- **Là gì:** Cách thực thi raw SQL queries trong Prisma, cần thiết khi dùng extension pgvector vì Prisma ORM chưa hỗ trợ vector operations natively.
- **Cách dùng:**
  ```typescript
  // Tìm kiếm vector gần nhất (cosine distance)
  const results = await this.prisma.$queryRawUnsafe<Result[]>(
    `SELECT id, 1 - (embedding <=> $1::vector) AS similarity
     FROM artwork_images
     WHERE embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    `[0.1, 0.2, ...]`, // vector dạng string
    20,                  // limit
  );

  // Lưu vector vào DB
  await this.prisma.$queryRawUnsafe(
    `UPDATE artwork_images SET embedding = $1::vector WHERE id = $2`,
    vectorStr, imageId,
  );
  ```
- **Ứng dụng:** `AiSearchService` dùng raw SQL với toán tử `<=>` (cosine distance) của pgvector để tìm artwork images có embedding gần nhất với query vector. Phải dùng `$queryRawUnsafe` vì Prisma không hỗ trợ cast `::vector` trong query builder.

---

#### Raw SQL with $queryRaw (CTE - Common Table Expressions)
- **Là gì:** Prisma cho phép chạy raw SQL khi query builder không đủ biểu đạt. CTE (WITH clause) cho phép định nghĩa "bảng tạm" trong cùng 1 câu query.
- **Cách dùng:**
  ```typescript
  const results = await this.prisma.$queryRaw<MyType[]>`
    WITH similar_users AS (
      SELECT DISTINCT user_id
      FROM user_interactions
      WHERE artwork_id = ${artworkId}
    )
    SELECT ui.artwork_id, SUM(ui.weight)::int AS match_score
    FROM user_interactions ui
    INNER JOIN similar_users su ON ui.user_id = su.user_id
    WHERE ui.artwork_id != ${artworkId}
    GROUP BY ui.artwork_id
    ORDER BY match_score DESC
    LIMIT ${limit}
  `;
  ```
- **Ứng dụng:** Dùng trong `RecommendationsService` để chạy Collaborative Filtering query phức tạp (CTE + self-join + aggregation) mà Prisma query builder không hỗ trợ. Tagged template literal tự động parameterize để chống SQL injection.

---

#### Prisma Upsert Pattern
- **Là gì:** Thao tác "tạo nếu chưa có, cập nhật nếu đã có" trong 1 lệnh duy nhất, tránh race condition giữa check-then-insert.
- **Cách dùng:**
  ```typescript
  await this.prisma.userInteraction.upsert({
    where: {
      userId_artworkId_action: { userId, artworkId, action },
    },
    update: { weight, createdAt: new Date() },
    create: { userId, artworkId, action, weight },
  });
  ```
- **Ứng dụng:** Dùng trong `InteractionsService` để ghi nhận interaction. Nếu user đã VIEW artwork trước đó, upsert sẽ update timestamp thay vì tạo record mới → tránh duplicate và đảm bảo weight luôn đúng.

---

#### sharp-phash (Perceptual Hashing)
- **Là gì:** Thư viện tạo "vân tay thị giác" (perceptual hash) cho ảnh. Hai ảnh giống nhau về mặt nội dung (dù resize, crop, nén khác) sẽ có hash gần giống nhau. Dùng kèm `sharp-phash/distance` để tính Hamming distance giữa 2 hash.
- **Cách dùng:**
  ```typescript
  import phash from 'sharp-phash';
  import dist from 'sharp-phash/distance';

  // Tạo hash từ buffer ảnh
  const hash = await phash(imageBuffer); // → chuỗi hex, ví dụ "a0b1c2d3..."

  // So sánh 2 hash
  const distance = dist(hash1, hash2); // → số nguyên, 0 = giống hệt
  // distance ≤ 5: gần như trùng | ≤ 10: nghi ngờ | > 10: khác nhau
  ```
- **Ứng dụng:** Dùng trong `DuplicateDetectionService` để phát hiện ảnh trùng lặp khi upload. Tạo phash cho ảnh mới, so sánh với tất cả phash đã lưu trong DB (`artwork_images.phash`), nếu Hamming distance ≤ 5 thì reject upload.


 # # # #   [ D e t e r m i n i s t i c   D a t a b a s e   S e e d i n g ] 
 -   * * L �   g � : * *   K �  t h u �t   t �o   d �  l i �u   m �u   n g �u   n h i � n   n h �n g   k �t   q u �  l u � n   c �  �n h   �  m �i   l �n   c h �y   n h �  g � n   c h u n g   1   ' k h � a '   ( s e e d ) . 
 -   * * C � c h   d � n g : * *   S �  d �n g   t h �  v i �n   ' @ f a k e r - j s / f a k e r '   k �t   h �p   g �i   ' f a k e r . s e e d ( n u m b e r ) ' . 
 -   * * �n g   d �n g : * *   G i � p   t �o   r a   b �  T e s t c a s e   v �i   B X H   t r e n d i n g ,   h �  t h �n g   c o m m e n t ,   l ��t   l i k e   c �  �n h   q u a   h � n g   t r m   l �n   t e s t   m �   k h � n g   c �n   h a r d c o d e   b �n g   t a y .  
 