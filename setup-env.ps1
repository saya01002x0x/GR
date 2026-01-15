# ============================================
# Script Setup Environment cho GR Project
# PowerShell Script cho Windows
# ============================================

Write-Host "================================" -ForegroundColor Cyan
Write-Host "GR Project - Setup Environment" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra file template
if (-not (Test-Path "frontend/env.template")) {
    Write-Host "❌ Không tìm thấy frontend/env.template" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "backend/env.template")) {
    Write-Host "❌ Không tìm thấy backend/env.template" -ForegroundColor Red
    exit 1
}

# Hỏi Clerk API Keys
Write-Host "📝 Nhập thông tin Clerk API Keys" -ForegroundColor Yellow
Write-Host "(Lấy từ: https://dashboard.clerk.com -> API Keys)" -ForegroundColor Gray
Write-Host ""

$clerkSecretKey = Read-Host "CLERK_SECRET_KEY (sk_test_...)"
if ([string]::IsNullOrWhiteSpace($clerkSecretKey)) {
    Write-Host "❌ CLERK_SECRET_KEY không được để trống!" -ForegroundColor Red
    exit 1
}

$clerkPublishableKey = Read-Host "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (pk_test_...)"
if ([string]::IsNullOrWhiteSpace($clerkPublishableKey)) {
    Write-Host "❌ CLERK_PUBLISHABLE_KEY không được để trống!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Đang tạo file .env..." -ForegroundColor Yellow

# Tạo frontend/.env
$frontendEnv = Get-Content "frontend/env.template" -Raw
$frontendEnv = $frontendEnv -replace "sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", $clerkSecretKey
$frontendEnv = $frontendEnv -replace "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", $clerkPublishableKey
$frontendEnv | Out-File -FilePath "frontend/.env" -Encoding UTF8 -NoNewline

Write-Host "✅ Đã tạo frontend/.env" -ForegroundColor Green

# Tạo backend/.env
$backendEnv = Get-Content "backend/env.template" -Raw
$backendEnv = $backendEnv -replace "sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", $clerkSecretKey
$backendEnv | Out-File -FilePath "backend/.env" -Encoding UTF8 -NoNewline

Write-Host "✅ Đã tạo backend/.env" -ForegroundColor Green

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "✨ Setup hoàn tất!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Các bước tiếp theo:" -ForegroundColor Cyan
Write-Host "  1. Chạy Docker services:" -ForegroundColor White
Write-Host "     docker-compose up -d" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Setup Backend:" -ForegroundColor White
Write-Host "     cd backend" -ForegroundColor Gray
Write-Host "     npm install" -ForegroundColor Gray
Write-Host "     npm run start:dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Setup Frontend (terminal mới):" -ForegroundColor White
Write-Host "     cd frontend" -ForegroundColor Gray
Write-Host "     npm install" -ForegroundColor Gray
Write-Host "     npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 URLs:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:   http://localhost:3001" -ForegroundColor White
Write-Host "  MinIO:     http://localhost:9001 (minioadmin/minioadmin123)" -ForegroundColor White
Write-Host "  Mailpit:   http://localhost:8025" -ForegroundColor White
Write-Host "  pgAdmin:   http://localhost:5050 (admin@admin.com/admin)" -ForegroundColor White
Write-Host ""

