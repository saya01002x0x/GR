import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Đang tìm kiếm các ảnh có chứa Vector Embedding trong Database...');
  
  // Dùng Raw Query để ép Prisma trả về cột Unsupported
  const results = await prisma.$queryRaw<
    Array<{ id: string; artwork_id: string; embedding: string }>
  >`
    SELECT 
      id, 
      artwork_id, 
      embedding::text 
    FROM artwork_images 
    WHERE embedding IS NOT NULL
    ORDER BY "createdAt" DESC
    LIMIT 5;
  `;

  if (results.length === 0) {
    console.log('❌ Không tìm thấy ảnh nào có Embedding. Bạn đã chắc chắn upload ảnh thật thành công chưa?');
    return;
  }

  console.log(`✅ Tìm thấy ${results.length} ảnh có chứa Embedding (hiển thị tối đa 5 ảnh mới nhất):\n`);

  for (const row of results) {
    console.log(`🖼️ Artwork ID: ${row.artwork_id}`);
    console.log(`📸 Image ID:   ${row.id}`);
    
    // Parse chuỗi vector thành mảng số để in cho gọn
    const vectorArray = JSON.parse(row.embedding);
    console.log(`📊 Kích thước: ${vectorArray.length} chiều (chuẩn Gemini)`);
    console.log(`🔢 Vector (in 10 số đầu để tham khảo):`);
    console.log(`   [${vectorArray.slice(0, 10).join(', ')} ... và 758 số nữa]`);
    console.log('-'.repeat(50));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
