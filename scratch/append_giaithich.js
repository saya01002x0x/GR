const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'docs', 'Giaithich.md');

const newContent = `
### [06/06] - Sửa lỗi TypeScript (Lint/Types) cho trang Discover
- **Logic:**
  - Sửa lỗi import \`@/types\` không tồn tại thành \`@/types/artwork\` để lấy đúng định dạng \`ArtworkListItem\` và \`ArtworkDetail\`.
  - Thêm các endpoint cấu hình \`discover\` vào \`frontend/src/api/endpoints.ts\` tương ứng với các route API ở backend.
  - Cập nhật kiểu dữ liệu trả về cho các hooks trong \`useDiscover.ts\` từ generic \`Artwork[]\` thành \`ArtworkDetail[]\` hoặc \`ArtworkListItem[]\` cụ thể.
  - Sửa lỗi mapping ở \`discover/page.tsx\` bằng cách chỉ định rõ kiểu dữ liệu tham số \`(artwork: ArtworkListItem, index: number)\`.
  - Sửa lỗi type assignability của \`Image\` trong \`FeaturedArtwork.tsx\` bằng cách bọc Mantine \`<Image>\` vào Next.js \`<Link>\` thay vì truyền component qua prop.
  - Khắc phục lỗi \`string | undefined\` không gán được cho \`string\` trong callback \`onChange\` của \`RankingSection.tsx\` bằng cách thêm fallback \`|| ''\`.
- **Decision:** Việc phân tách rõ ràng và sử dụng trực tiếp các kiểu dữ liệu từ \`src/types/artwork.ts\` giúp tối ưu hóa type checking trên frontend, đồng thời bọc Image bằng Link giúp loại bỏ xung đột prop giữa Mantine 8 và Next.js Link.
`;

try {
  fs.appendFileSync(filePath, newContent, 'utf8');
  console.log('Successfully appended to docs/Giaithich.md');
} catch (err) {
  console.error('Error appending to file:', err);
}
