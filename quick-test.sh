#!/bin/bash

# 🧪 Quick Test Script for GTX EduKids
# Run this for quick testing scenarios

echo "🎯 GTX EduKids Quick Test Script"
echo "================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

# Check if server is running
print_status "Checking if server is running..."
if curl -s http://localhost:3000 > /dev/null; then
    print_success "Server is running at http://localhost:3000"
else
    print_error "Server is not running. Please start with 'npm run dev'"
    exit 1
fi

# Test 1: Home Page
print_test "Test 1: Home Page Loading"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    print_success "✅ Home page loads successfully"
else
    print_error "❌ Home page failed to load"
fi

# Test 2: Login Page
print_test "Test 2: Login Page Loading"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login/guru | grep -q "200"; then
    print_success "✅ Login page loads successfully"
else
    print_error "❌ Login page failed to load"
fi

# Test 3: Registration Page
print_test "Test 3: Registration Page Loading"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/register/guru | grep -q "200"; then
    print_success "✅ Registration page loads successfully"
else
    print_error "❌ Registration page failed to load"
fi

# Test 4: Siswa Login Page
print_test "Test 4: Siswa Login Page Loading"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login/siswa | grep -q "200"; then
    print_success "✅ Siswa login page loads successfully"
else
    print_error "❌ Siswa login page failed to load"
fi

# Test 5: API Registration
print_test "Test 5: API Registration Endpoint"
response=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "123456",
    "role": "guru"
  }')

if echo "$response" | grep -q "message"; then
    print_success "✅ API registration endpoint works"
else
    print_error "❌ API registration endpoint failed"
    echo "Response: $response"
fi

# Test 6: API Login
print_test "Test 6: API Login Endpoint"
response=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456",
    "role": "guru"
  }')

if echo "$response" | grep -q "token"; then
    print_success "✅ API login endpoint works"
    # Extract token for next test
    TOKEN=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
else
    print_error "❌ API login endpoint failed"
    echo "Response: $response"
fi

# Test 7: Protected API (with token)
if [ ! -z "$TOKEN" ]; then
    print_test "Test 7: Protected API Endpoint"
    response=$(curl -s -X GET http://localhost:3000/api/ujian \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$response" | grep -q "\["; then
        print_success "✅ Protected API endpoint works"
    else
        print_error "❌ Protected API endpoint failed"
        echo "Response: $response"
    fi
else
    print_error "❌ Cannot test protected API - no token available"
fi

# Test 8: Static Assets
print_test "Test 8: Static Assets Loading"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/_next/static/css/app/layout.css | grep -q "200"; then
    print_success "✅ Static assets load successfully"
else
    print_error "❌ Static assets failed to load"
fi

echo ""
print_status "Quick Test Complete!"
echo "=========================="
echo ""
echo "📝 Manual Testing Checklist:"
echo "1. Open http://localhost:3000 in browser"
echo "2. Test guru registration flow"
echo "3. Test guru login flow"
echo "4. Test dashboard functionality"
echo "5. Test siswa upload (Excel file)"
echo "6. Test ujian upload (PDF + Excel)"
echo "7. Test siswa login flow"
echo "8. Test ujian completion flow"
echo ""
echo "🔧 For detailed testing, see TESTING.md"
echo "📊 For sample data, see SAMPLE_DATA.md"
echo "⌨️  For VS Code commands, see VS_CODE_COMMANDS.md"