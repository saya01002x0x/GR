/**
 * Script để lấy test token từ Clerk
 * Chạy: npx ts-node scripts/get-test-token.ts
 */

import { createClerkClient } from '@clerk/backend';

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

async function getTestToken() {
  try {
    console.log('🔍 Đang tìm users...\n');

    // Lấy danh sách users
    const users = await clerk.users.getUserList({ limit: 10 });

    if (users.data.length === 0) {
      console.log('❌ Không tìm thấy user nào.');
      console.log('💡 Hãy tạo user tại: https://dashboard.clerk.com\n');
      return;
    }

    console.log(`✅ Tìm thấy ${users.data.length} users:\n`);

    // Hiển thị thông tin users
    for (const user of users.data) {
      const email =
        user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
          ?.emailAddress || 'No email';
      const role = (user.publicMetadata as any)?.role || 'no-role';

      console.log(`📧 Email: ${email}`);
      console.log(`👤 User ID: ${user.id}`);
      console.log(`🎭 Role: ${role}`);

      // Lấy sessions
      const sessions = await clerk.sessions.getSessionList({
        userId: user.id,
        status: 'active',
      });

      if (sessions.data.length > 0) {
        // Note: getToken() không available trực tiếp trong @clerk/backend
        // Cần lấy token từ frontend sau khi login
        console.log(`✅ User có active session`);
        console.log(`💡 Để lấy token:`);
        console.log(`   1. Đăng nhập tại: http://localhost:3000/sign-in`);
        console.log(`   2. Mở DevTools Console`);
        console.log(`   3. Chạy: await window.Clerk.session.getToken()`);
      } else {
        console.log('⚠️  Không có active session');
        console.log('💡 Đăng nhập tại: http://localhost:3000/sign-in');
      }

      console.log('─'.repeat(80));
      console.log('');
    }

    console.log('\n📝 Cách sử dụng token:');
    console.log('1. Copy token ở trên');
    console.log('2. Thêm vào header: Authorization: Bearer <token>');
    console.log('3. Test API với Postman/Thunder Client/curl\n');

    console.log('📖 Ví dụ với curl:');
    console.log(
      'curl http://localhost:3001/api/artworks -H "Authorization: Bearer YOUR_TOKEN"\n',
    );
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.log('\n💡 Kiểm tra:');
    console.log('  1. CLERK_SECRET_KEY đã được set trong .env chưa?');
    console.log('  2. Key có đúng format sk_test_... hoặc sk_live_...?');
    console.log('  3. Backend có đang chạy không?\n');
  }
}

getTestToken();

