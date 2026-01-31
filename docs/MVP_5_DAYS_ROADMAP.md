# 🚀 ArtSpace MVP: Lộ trình 5 Ngày (Chiến thuật 80/20)

Lộ trình này tập trung vào việc hoàn thiện bộ khung quan trọng nhất: **Đưa ảnh lên - Xem ảnh - Tương tác.** 
Chiến thuật chủ đạo: **Lazy Sync User** (không dùng Webhook) để tối ưu tốc độ triển khai Local.

---

## 📅 NGÀY 1: "Thông nòng" Dữ liệu (Foundation & Lazy Sync)
**Mục tiêu:** Đảm bảo hệ thống nhận diện được User trong DB để làm bàn đạp cho mọi tính năng sau.

*   **Backend:**
    *   Implement `Lazy Sync` trong `ClerkStrategy`: Kiểm tra DB, nếu chưa có user thì `upsert` (tạo mới) ngay khi có request.
    *   Gắn Database User vào `req.user` thay vì chỉ dùng token.
*   **Frontend:**
    *   Hoàn thiện Header (Toggle Theme, Avatar Menu).
    *   Test luồng login -> DB tự sinh dữ liệu User.

## 📅 NGÀY 2: "Bộ mặt" ứng dụng (Discovery & Detail)
**Mục tiêu:** User vào là phải thấy Art ngay lập tức.

*   **Backend:**
    *   Tạo API `GET /artworks` (Lấy danh sách ảnh, hỗ trợ phân trang cơ bản).
    *   Tạo API `GET /artworks/:id` (Lấy chi tiết 1 tấm ảnh).
*   **Frontend:**
    *   **Trang Discover:** Hiển thị Masonry Grid (đã có component masonry trong `global.css`).
    *   **Trang Detail:** Hiển thị ảnh lớn, thông tin Artist, và sidebar chứa nút Like/Collect.

## 📅 NGÀY 3: Quy trình Artist (Upload & Image Processing)
**Mục tiêu:** Cho phép Artist đăng tải tác phẩm với khả năng tối ưu hóa hình ảnh.

*   **Backend:**
    *   API `PATCH /users/become-artist`: Nâng cấp account.
    *   **Image Processing (Sharp):** Tích hợp Sharp để tự động resize, nén ảnh và tạo bản thumbnail/preview khi nhận file.
    *   **Backend Upload:** Viết endpoint nhận `multipart/form-data`. Backend nhận file -> xử lý qua Sharp -> đẩy lên MinIO/S3.
    *   API `POST /artworks`: Lưu metadata và path của các bản ảnh (original, preview) vào DB.
*   **Frontend:**
    *   Dashboard: Nút "Trở thành Artist".
    *   **Trang Upload:** Form upload ảnh truyền thống (FormData). Xử lý previews trên giao diện trước khi bấm Submit.

## 📅 NGÀY 4: Tương tác & Cộng đồng (Social Interaction)
**Mục tiêu:** Biến web tĩnh thành mạng xã hội nghệ thuật.

*   **Backend:**
    *   API `POST /artworks/:id/like`: Bật/tắt like.
    *   API Comment: `GET` và `POST` comment cho artwork.
    *   API Collections: Tạo folder và lưu ảnh vào folder.
*   **Frontend:**
    *   Tích hợp nút Like (Realtime-ish với React Query).
    *   Phần Comment bên dưới ảnh Detail.
    *   Modal "Lưu vào bộ sưu tập".

## 📅 NGÀY 5: Đánh bóng & "Về đích" (Polish & Final Touch)
**Mục tiêu:** Rà soát lỗi, UI/UX và chuẩn bị Demo.

*   **UI/UX:**
    *   Check Responsive (Mobile phải xem được ảnh mượt).
    *   Loading States (Skeleton screens khi đang load ảnh).
    *   Xử lý lỗi (Khi upload fail, khi truy cập link chết).
*   **Dọn dẹp:**
    *   Xóa code thừa, fix nốt các lỗi lint/warning.
    *   Viết file README hướng dẫn chạy bản MVP.

---

## 🎯 Key Milestone (Điểm mấu chốt)
Sau **Ngày 3**, bạn đã có một sản phẩm "sống" (lưu được dữ liệu, hiện được ảnh tự upload). Hai ngày cuối là để làm nó "sướng" (tương tác, mượt mà).

**Lời khuyên:** Đừng sa đà vào các tính năng phụ như "Search nâng cao", "Filter phức tạp" hay "Notification realtime" trong 5 ngày này. Hãy làm 3 trụ cột bạn đã chọn thật tốt!
