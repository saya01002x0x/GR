# 🔧 Backend Scripts

Các utility scripts để hỗ trợ development và testing.

## 📜 Available Scripts

### 1. `create-test-users.ts`

Tạo test users với các roles khác nhau để test authentication và RBAC.

**Usage:**
```bash
npx ts-node scripts/create-test-users.ts
```

**Tạo users:**
- `admin@test.local` - Admin role
- `moderator@test.local` - Moderator role
- `member@test.local` - Member role

**Password mặc định:** Xem output của script

### 2. `get-test-token.ts`

Lấy JWT tokens từ active sessions để test API endpoints.

**Usage:**
```bash
npx ts-node scripts/get-test-token.ts
```

**Requirements:**
- Users phải đã đăng nhập (có active session)
- Backend đang chạy
- CLERK_SECRET_KEY được set trong .env

**Output:**
- User info (email, role)
- JWT token
- Hướng dẫn sử dụng

---

## 🚀 Quick Workflow

### 1. Tạo Test Users

```bash
# Tạo users với roles
npx ts-node scripts/create-test-users.ts
```

### 2. Đăng Nhập

Mở browser: http://localhost:3000/sign-in

Đăng nhập với account vừa tạo.

### 3. Lấy Tokens

```bash
# Get tokens sau khi đăng nhập
npx ts-node scripts/get-test-token.ts
```

### 4. Test API

```bash
# Copy token từ output
curl http://localhost:3001/api/artworks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Custom Scripts

Bạn có thể tạo scripts mới trong folder này:

### Template Script

```typescript
// scripts/my-script.ts
import { Clerk } from '@clerk/clerk-sdk-node';

const clerk = new Clerk({
  secretKey: process.env.CLERK_SECRET_KEY,
});

async function myScript() {
  try {
    // Your logic here
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

myScript();
```

**Chạy:**
```bash
npx ts-node scripts/my-script.ts
```

---

## 🔐 Environment Variables

Scripts cần các env vars sau trong `backend/.env`:

```env
CLERK_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://...
```

---

## 🆘 Troubleshooting

### Error: "Cannot find module '@clerk/clerk-sdk-node'"

**Fix:**
```bash
cd backend
npm install
```

### Error: "CLERK_SECRET_KEY is required"

**Fix:**
```bash
# Kiểm tra backend/.env
cat .env | grep CLERK_SECRET_KEY

# Chạy lại setup nếu cần
cd ..
.\setup-env.ps1  # Windows
./setup-env.sh   # Linux/Mac
```

### Error: "User not found"

**Nguyên nhân:** User chưa được tạo hoặc đã bị xóa

**Fix:**
```bash
# Tạo lại test users
npx ts-node scripts/create-test-users.ts
```

### No active sessions

**Nguyên nhân:** User chưa đăng nhập

**Fix:**
1. Mở http://localhost:3000/sign-in
2. Đăng nhập với test account
3. Chạy lại `get-test-token.ts`

---

## 💡 Tips

1. **Add to package.json:**
   ```json
   {
     "scripts": {
       "test:create-users": "ts-node scripts/create-test-users.ts",
       "test:get-tokens": "ts-node scripts/get-test-token.ts"
     }
   }
   ```
   
   Sau đó chạy:
   ```bash
   npm run test:create-users
   npm run test:get-tokens
   ```

2. **One-liner:**
   ```bash
   npm run test:create-users && npm run test:get-tokens
   ```

3. **CI/CD:** Có thể dùng scripts này trong automated tests

---

## 📚 Related Docs

- [Testing Quick Start](../../docs/TESTING_QUICK_START.md)
- [Testing with Clerk](../../docs/TESTING_WITH_CLERK.md)
- [API Keys Guide](../../docs/API_KEYS.md)

