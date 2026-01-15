/**
 * Script để tạo test users với các roles khác nhau
 * Chạy: npx ts-node scripts/create-test-users.ts
 */

import { createClerkClient } from '@clerk/backend';

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const TEST_USERS = [
  {
    email: 'admin@test.local',
    password: 'Admin123!@#',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
  },
  {
    email: 'moderator@test.local',
    password: 'Moderator123!@#',
    role: 'moderator',
    firstName: 'Moderator',
    lastName: 'User',
  },
  {
    email: 'member@test.local',
    password: 'Member123!@#',
    role: 'member',
    firstName: 'Member',
    lastName: 'User',
  },
];

async function createTestUsers() {
  console.log('🚀 Đang tạo test users...\n');

  for (const userData of TEST_USERS) {
    try {
      // Check if user already exists
      const existingUsers = await clerk.users.getUserList({
        emailAddress: [userData.email],
      });

      if (existingUsers.data.length > 0) {
        console.log(`⚠️  User ${userData.email} đã tồn tại, skip...`);
        continue;
      }

      // Create user
      const user = await clerk.users.createUser({
        emailAddress: [userData.email],
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        publicMetadata: {
          role: userData.role,
        },
        skipPasswordRequirement: false,
      });

      console.log(`✅ Đã tạo user: ${userData.email}`);
      console.log(`   Role: ${userData.role}`);
      console.log(`   User ID: ${user.id}`);
      console.log('');
    } catch (error) {
      console.error(`❌ Lỗi khi tạo ${userData.email}:`, error.message);
      console.log('');
    }
  }

  console.log('─'.repeat(80));
  console.log('✨ Hoàn tất!\n');

  console.log('📝 Thông tin đăng nhập:');
  console.log('');
  TEST_USERS.forEach((user) => {
    console.log(`${user.role.toUpperCase()}:`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: ${user.password}`);
    console.log('');
  });

  console.log('🌐 Đăng nhập tại: http://localhost:3000/sign-in');
  console.log(
    '🔑 Lấy tokens: npx ts-node scripts/get-test-token.ts (sau khi đăng nhập)\n',
  );
}

createTestUsers();

