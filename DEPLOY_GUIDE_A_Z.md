# Hướng Dẫn Deploy Đồ Án "Lumina" Lên VPS (A-Z) 🚀

Chào bạn! Đây là cuốn bí kíp tối thượng giúp bạn đưa đồ án tốt nghiệp của mình lên VPS chạy thực tế. Đừng lo lắng nếu bạn chưa từng cấu hình server bao giờ, hướng dẫn này được viết để bạn có thể **copy - paste** từng dòng lệnh một cách dễ dàng.

---

## Bước 0: Chuẩn Bị Trên Máy Local (Windows)

Trước khi thuê VPS, bạn cần một chìa khóa điện tử (SSH Key) để đăng nhập an toàn, thay vì dùng mật khẩu dễ bị hack.

1. Mở PowerShell hoặc Terminal trên máy tính của bạn.
2. Gõ lệnh tạo khóa:
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```
   *(Cứ ấn Enter liên tục khi được hỏi để dùng thiết lập mặc định).*
3. Xem nội dung khóa công khai (Public Key) vừa tạo:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
4. Copy toàn bộ chuỗi ký tự hiển thị ra (bắt đầu bằng `ssh-ed25519...`). Chúng ta sẽ dùng nó ở Bước 1.

---

## Bước 1: Khởi Tạo VPS Trên Digital Ocean

1. Đăng nhập vào Digital Ocean, chọn **Create Droplet**.
2. **Region**: Chọn `Singapore` (để tốc độ tải về Việt Nam là nhanh nhất).
3. **Image**: Chọn `Ubuntu 24.04 (LTS) x64` (hoặc 22.04 LTS).
4. **Size**: Chọn thẻ *Basic*, loại *Regular CPU*. Khuyên dùng mức **$12/tháng (2GB RAM, 50GB SSD)** vì hệ thống có database, Redis, MinIO và chạy build Docker sẽ tốn kha khá RAM.
5. **Authentication**: Chọn **SSH Key**. Nhấn `New SSH Key`, dán đoạn khóa ở Bước 0 vào, đặt tên (ví dụ: `my-laptop`) và lưu lại.
6. Nhấn **Create Droplet**. Chờ một lát, bạn sẽ được cấp một địa chỉ **IP VPS** (ví dụ: `167.xxx.xxx.xxx`).

---

## Bước 2: Đăng Nhập Và Bảo Mật VPS

Trở lại PowerShell trên máy tính của bạn:

1. Đăng nhập vào VPS bằng quyền cao nhất (root):
   ```bash
   ssh root@<IP_VPS_CỦA_BẠN>
   ```
   *(Lần đầu tiên nó hỏi "Are you sure you want to continue connecting?", gõ `yes` và Enter).*

2. **Cập nhật hệ thống:**
   ```bash
   apt update && apt upgrade -y
   ```

3. **Cấu hình Tường lửa (UFW):**
   Mặc định server mở toang mọi cổng. Ta cần đóng hết và chỉ chừa lại cổng kết nối an toàn.
   ```bash
   ufw allow 22/tcp     # Mở cổng SSH
   ufw allow 80/tcp     # Mở cổng HTTP
   ufw allow 443/tcp    # Mở cổng HTTPS
   ufw enable           # Bật tường lửa (nhấn y khi được hỏi)
   ufw status           # Kiểm tra trạng thái
   ```
   > 💡 **Tại sao?** Việc này giúp chặn kẻ xấu chọc phá thẳng vào Database (5432) hay Redis (6379) của bạn. Mọi truy cập vào ứng dụng sẽ phải đi qua cổng 80/443 do Nginx gác cổng.

---

## Bước 3: Cài Đặt Docker & Docker Compose

Chạy lần lượt các lệnh sau để cài đặt Docker (nền tảng chạy ứng dụng):

```bash
# Thêm khóa xác thực của Docker
apt-get update
apt-get install ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

# Thêm kho chứa (repository) Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Cài đặt Docker
apt-get update
apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y

# Kiểm tra xem đã cài thành công chưa
docker compose version
```

---

## Bước 4: Tên Miền & Cloudflare (Siêu Quan Trọng)

Đồ án của bạn sẽ chuyên nghiệp hơn với tên miền `luminaaaa.studio`.

1. Tạo tài khoản [Cloudflare](https://dash.cloudflare.com/) và nhấn **Add a site** -> nhập `luminaaaa.studio`.
2. Chọn gói **Free**.
3. Cloudflare sẽ cấp cho bạn 2 Nameservers (ví dụ `jean.ns.cloudflare.com` và `rick.ns.cloudflare.com`).
4. Đăng nhập vào trang quản trị tên miền của bạn (name.com), tìm phần **Nameservers**, xóa các dòng mặc định và thay bằng 2 dòng của Cloudflare.
5. Đợi vài phút để Cloudflare nhận dạng.

**Cấu hình DNS trên Cloudflare:**
Vào mục **DNS -> Records** trên Cloudflare, thêm 2 bản ghi sau:
- `Type: A` | `Name: @` | `IPv4: <IP_VPS_CỦA_BẠN>` | Trạng thái: ☁️ Đám mây màu cam (Proxied)
- `Type: A` | `Name: api` | `IPv4: <IP_VPS_CỦA_BẠN>` | Trạng thái: ☁️ Đám mây màu cam (Proxied)

> 🛡️ **Tác dụng của Đám mây cam:** Nó sẽ giấu địa chỉ IP thật của VPS, chống bị tấn công DDoS và tự động cấp ổ khóa xanh (HTTPS) cho web của bạn.

---

## Bước 5: Kéo Code Về VPS Và Cấu Hình

Vẫn ở cửa sổ dòng lệnh VPS:

1. **Clone mã nguồn (nhánh B):**
   ```bash
   git clone <LINK_GITHUB_CỦA_BẠN> gr-project
   cd gr-project
   # Chuyển sang nhánh bạn đang làm việc (nếu cần)
   # git checkout nhanh-b
   ```

2. **Cấu hình biến môi trường:**
   Hệ thống cần file `.env` để hoạt động. Tôi đã tạo sẵn mẫu cho bạn.
   ```bash
   cp .env.production.example .env
   nano .env
   ```
   *(Giao diện soạn thảo hiện ra, dùng phím mũi tên để di chuyển).*

   **Các biến cần đặc biệt lưu ý thay đổi:**
   - `POSTGRES_PASSWORD`: Đổi thành mật khẩu khó đoán.
   - `DATABASE_URL`: Đổi chữ `CHANGE_ME...` thành mật khẩu vừa nhập ở trên.
   - `MINIO_ROOT_PASSWORD`: Mật khẩu đăng nhập hệ thống lưu trữ file.
   - `CLERK_SECRET_KEY` & `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Lấy từ dashboard của Clerk (nhớ chọn môi trường Production).
   - `GEMINI_API_KEY`: Key AI của bạn.

   *Xong thì bấm `Ctrl + O`, `Enter` để lưu, rồi `Ctrl + X` để thoát.*

---

## Bước 6: Build Và Khởi Chạy Mọi Thứ 🚀

Khoảnh khắc của sự thật! Chỉ cần gõ 2 lệnh này:

```bash
# Xây dựng các cục gạch (Docker Images). Có thể mất 3-5 phút.
docker compose -f docker-compose.prod.yml build

# Khởi động toàn bộ hệ thống ở chế độ chạy ngầm
docker compose -f docker-compose.prod.yml up -d
```

**Khởi tạo Database:**
Lần đầu chạy, database của bạn trống trơn. Chạy lệnh sau để tạo các bảng (tables):
```bash
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

**Đổ dữ liệu mẫu (Seed Data):**
Để đồ án có sẵn sản phẩm, bài đăng cho giáo viên xem:
```bash
docker compose -f docker-compose.prod.yml exec backend npm run db:reseed
```
*(Lưu ý: Tôi thấy trong `package.json` của bạn có lệnh `db:reseed`, nó sẽ chạy seed bình thường + seed AI).*

---

## Bước 6.5: Setup Storage Bằng Tuyệt Chiêu "Mượn Đao Giết Người" 🥷

Để đồ án chạy được, hệ thống lưu trữ MinIO cần phải có một "chiếc xô" (Bucket) để đựng ảnh. Chúng ta sẽ áp dụng chiến thuật mở cửa tạm thời rồi đóng sập lại:

**Hành động 1: Tạo Bucket và Key**
1. Mở trình duyệt, truy cập: `http://<IP_VPS_CỦA_BẠN>:9001` (Đây là cổng 9001 chúng ta đang mở tạm trong file `docker-compose.prod.yml`).
2. Đăng nhập bằng `MINIO_ROOT_USER` và `MINIO_ROOT_PASSWORD` bạn đã cấu hình trong `.env`.
3. Vào menu **Buckets** -> Nhấn **Create Bucket** -> Đặt tên là `lumina-artworks`.
4. Bấm vào bucket `lumina-artworks` vừa tạo -> Chọn **Summary** -> Ở phần **Access Policy**, chuyển từ `Private` sang `Public` (Rất quan trọng, nếu không Nginx sẽ không lấy được ảnh để hiện lên web).
5. Vào menu **Access Keys** -> Nhấn **Create Access Key** -> Copy lại `Access Key` và `Secret Key`.
6. Mở file `.env` trên VPS (`nano .env`), dán 2 key này vào `MINIO_ROOT_USER` và `MINIO_ROOT_PASSWORD` (nếu chưa khớp) hoặc cập nhật lại file cấu hình ứng dụng nếu nó yêu cầu key riêng. (Thực ra đồ án của bạn backend đang lấy luôn root user làm key, nên chỉ cần đảm bảo tạo bucket tên là `lumina-artworks` là đủ!).

**Hành động 2: "Rút Ván" - Chuyển Về Bảo Mật Cực Đoan**
Khi đã có bucket, chúng ta không cần giao diện MinIO rủi ro này nằm tơ hơ trên mạng nữa!
1. Mở file Docker:
   ```bash
   nano docker-compose.prod.yml
   ```
2. Kéo xuống chỗ service `minio:`, tìm đến dòng `ports:` và `- "9001:9001"`. Xóa (hoặc thêm dấu `#` vào đầu) cả 2 dòng này.
3. Cập nhật lại hệ thống:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```
*Boom! Giao diện MinIO ở port 9001 bốc hơi khỏi Internet. Chế độ bảo mật tuyệt đối được kích hoạt!*

---

## Bước 7: Cấu Hình Các Dịch Vụ Bên Ngoài (Clerk / Stripe)

1. **Clerk:** Vào [Dashboard Clerk](https://dashboard.clerk.com/), chuyển sang môi trường **Production**. Tại phần **Domain**, thêm `luminaaaa.studio` vào. (Lưu ý: Bạn phải làm bước này thì chức năng đăng nhập mới hoạt động trên VPS).
2. **Stripe:** Vào Dashboard -> Developers -> Webhooks. Thêm endpoint mới là `https://api.luminaaaa.studio/api/webhook`.

---

## Bước 8: Kiểm Tra Hệ Thống

Mở trình duyệt trên máy tính của bạn và truy cập:
- Website chính: `https://luminaaaa.studio`
- Tài liệu API: `https://api.luminaaaa.studio/api`

🎉 **CHÚC MỪNG BẠN ĐÃ TRIỂN KHAI THÀNH CÔNG ĐỒ ÁN TỐT NGHIỆP!** 🎉

---

## 🛠 Cẩm Nang Sinh Tồn (Các Lệnh Hay Dùng)

- **Xem log hệ thống (khi lỗi):**
  ```bash
  docker compose -f docker-compose.prod.yml logs -f
  # Hoặc xem riêng backend:
  docker compose -f docker-compose.prod.yml logs backend -f
  ```
- **Cập nhật code mới (khi bạn sửa lỗi trên máy tính và push lên Github):**
  ```bash
  git pull
  docker compose -f docker-compose.prod.yml build
  docker compose -f docker-compose.prod.yml up -d
  ```
- **Tắt toàn bộ hệ thống:**
  ```bash
  docker compose -f docker-compose.prod.yml down
  ```
- **Lấy file Backup Database đem về báo cáo:**
  ```bash
  docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres gr_production > backup.sql
  ```
