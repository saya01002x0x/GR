# 🧪 Testing Quick Start

Hướng dẫn nhanh để test API với authentication và RBAC.

## ⚡ Quick Setup (5 phút)

### Bước 1: Tạo Test Users

```bash
cd backend
npx ts-node scripts/create-test-users.ts
```

**Output:**
```
✅ Đã tạo user: admin@test.local
✅ Đã tạo user: moderator@test.local
✅ Đã tạo user: member@test.local
```

### Bước 2: Đăng Nhập

1. Mở http://localhost:3000/sign-in
2. Đăng nhập với một trong các accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.local | Admin123!@# |
| Moderator | moderator@test.local | Moderator123!@# |
| Member | member@test.local | Member123!@# |

### Bước 3: Lấy Test Tokens

```bash
npx ts-node scripts/get-test-token.ts
```

**Output:**
```
📧 Email: admin@test.local
🎭 Role: admin
🔑 Token:
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

Copy các tokens này để test API.

### Bước 4: Test API

#### Cách 1: Thunder Client (VS Code)

1. Install extension **Thunder Client**
2. Import collection: `thunder-client-collection.json`
3. Update environment variables:
   - Paste `memberToken`
   - Paste `moderatorToken`
   - Paste `adminToken`
4. Run requests để test!

#### Cách 2: cURL

```bash
# Test với member token
curl http://localhost:3001/api/artworks \
  -H "Authorization: Bearer YOUR_MEMBER_TOKEN"

# Test với admin token
curl -X DELETE http://localhost:3001/api/artworks/1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Cách 3: Postman

1. Import `thunder-client-collection.json` vào Postman
2. Tạo environment với các tokens
3. Run collection

---

## 🎯 Test Scenarios

### 1. Public Access (Không cần token)

```bash
curl http://localhost:3001/api/artworks
# Expected: 200 OK
```

### 2. Authenticated Access (Cần token)

```bash
curl http://localhost:3001/api/artworks/create \
  -H "Authorization: Bearer MEMBER_TOKEN"
# Expected: 201 Created
```

### 3. Role-Based Access

#### Member (Basic permissions)

```bash
# ✅ CAN: Create artwork
curl -X POST http://localhost:3001/api/artworks \
  -H "Authorization: Bearer MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test"}'
# Expected: 201

# ❌ CANNOT: Delete others' artwork
curl -X DELETE http://localhost:3001/api/artworks/1 \
  -H "Authorization: Bearer MEMBER_TOKEN"
# Expected: 403 Forbidden
```

#### Moderator (Moderate content)

```bash
# ✅ CAN: Feature artwork
curl -X POST http://localhost:3001/api/artworks/1/feature \
  -H "Authorization: Bearer MODERATOR_TOKEN"
# Expected: 200

# ✅ CAN: Delete any artwork
curl -X DELETE http://localhost:3001/api/artworks/1 \
  -H "Authorization: Bearer MODERATOR_TOKEN"
# Expected: 200
```

#### Admin (Full access)

```bash
# ✅ CAN: Access admin endpoints
curl http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer ADMIN_TOKEN"
# Expected: 200

# ✅ CAN: Delete users
curl -X DELETE http://localhost:3001/api/admin/users/123 \
  -H "Authorization: Bearer ADMIN_TOKEN"
# Expected: 200
```

---

## 🔄 Automated Testing

### Unit Tests

```bash
cd backend
npm run test
```

### E2E Tests

```bash
cd backend
npm run test:e2e
```

### Test Coverage

```bash
cd backend
npm run test:cov
```

---

## 📊 Permission Matrix

| Endpoint | Public | Member | Moderator | Admin |
|----------|--------|--------|-----------|-------|
| `GET /artworks` | ✅ | ✅ | ✅ | ✅ |
| `POST /artworks` | ❌ | ✅ | ✅ | ✅ |
| `PUT /artworks/:id` (own) | ❌ | ✅ | ✅ | ✅ |
| `DELETE /artworks/:id` (own) | ❌ | ✅ | ✅ | ✅ |
| `POST /artworks/:id/feature` | ❌ | ❌ | ✅ | ✅ |
| `DELETE /artworks/:id` (any) | ❌ | ❌ | ✅ | ✅ |
| `GET /admin/*` | ❌ | ❌ | ❌ | ✅ |

---

## 🛠️ Helper Scripts

### Get Fresh Tokens

```bash
# Sau khi users đăng nhập
npx ts-node scripts/get-test-token.ts
```

### Create More Test Users

```bash
# Edit scripts/create-test-users.ts
# Thêm users vào TEST_USERS array
# Chạy lại script
```

### Browser Console (Get Token)

```javascript
// Mở DevTools tại http://localhost:3000
const token = await window.Clerk.session.getToken();
console.log(token);
```

---

## 💡 Tips

1. **Token Expiration**: Clerk tokens expire sau 1 giờ, get token mới khi cần
2. **Environment**: Dùng test keys riêng cho testing
3. **Cleanup**: Xóa test data sau khi test xong
4. **CI/CD**: Setup automated tests trong pipeline

---

## 🔗 Related Docs

- [Full Testing Guide](./TESTING_WITH_CLERK.md)
- [API Keys Guide](./API_KEYS.md)
- [Cheat Sheet](./CHEAT_SHEET.md)

---

**Ready to test? Chạy `npx ts-node scripts/create-test-users.ts` để bắt đầu! 🚀**

