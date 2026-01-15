#!/bin/bash

# ============================================
# Script Setup Environment cho GR Project
# Bash Script cho Linux/Mac
# ============================================

echo "================================"
echo "GR Project - Setup Environment"
echo "================================"
echo ""

# Kiểm tra file template
if [ ! -f "frontend/env.template" ]; then
    echo "❌ Không tìm thấy frontend/env.template"
    exit 1
fi

if [ ! -f "backend/env.template" ]; then
    echo "❌ Không tìm thấy backend/env.template"
    exit 1
fi

# Hỏi Clerk API Keys
echo "📝 Nhập thông tin Clerk API Keys"
echo "(Lấy từ: https://dashboard.clerk.com -> API Keys)"
echo ""

read -p "CLERK_SECRET_KEY (sk_test_...): " clerk_secret_key
if [ -z "$clerk_secret_key" ]; then
    echo "❌ CLERK_SECRET_KEY không được để trống!"
    exit 1
fi

read -p "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (pk_test_...): " clerk_publishable_key
if [ -z "$clerk_publishable_key" ]; then
    echo "❌ CLERK_PUBLISHABLE_KEY không được để trống!"
    exit 1
fi

echo ""
echo "🔧 Đang tạo file .env..."

# Tạo frontend/.env
sed "s/sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/$clerk_secret_key/g; s/pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/$clerk_publishable_key/g" frontend/env.template > frontend/.env
echo "✅ Đã tạo frontend/.env"

# Tạo backend/.env
sed "s/sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/$clerk_secret_key/g" backend/env.template > backend/.env
echo "✅ Đã tạo backend/.env"

echo ""
echo "================================"
echo "✨ Setup hoàn tất!"
echo "================================"
echo ""
echo "📋 Các bước tiếp theo:"
echo "  1. Chạy Docker services:"
echo "     docker-compose up -d"
echo ""
echo "  2. Setup Backend:"
echo "     cd backend"
echo "     npm install"
echo "     npm run start:dev"
echo ""
echo "  3. Setup Frontend (terminal mới):"
echo "     cd frontend"
echo "     npm install"
echo "     npm run dev"
echo ""
echo "🌐 URLs:"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:3001"
echo "  MinIO:     http://localhost:9001 (minioadmin/minioadmin123)"
echo "  Mailpit:   http://localhost:8025"
echo "  pgAdmin:   http://localhost:5050 (admin@admin.com/admin)"
echo ""

