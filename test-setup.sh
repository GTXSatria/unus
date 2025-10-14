#!/bin/bash

# 🧪 GTX EduKids Testing Script
# Run this script in VS Code terminal

echo "🚀 Starting GTX EduKids Testing..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Node.js is installed
print_status "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 15+"
    exit 1
fi

# Check if npm is installed
print_status "Checking npm installation..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm installed: $NPM_VERSION"
else
    print_error "npm not found. Please install npm"
    exit 1
fi

# Install dependencies if needed
print_status "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
else
    print_success "Dependencies already installed"
fi

# Setup database
print_status "Setting up database..."
npm run db:push
if [ $? -eq 0 ]; then
    print_success "Database setup complete"
else
    print_error "Database setup failed"
    exit 1
fi

# Check if .env.local exists
print_status "Checking environment variables..."
if [ ! -f ".env.local" ]; then
    print_warning ".env.local not found. Creating default file..."
    cat > .env.local << EOF
DATABASE_URL="file:./dev.db"
JWT_SECRET="gtx-edukids-secret-key-for-development"
NEXTAUTH_SECRET="gtx-edukids-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
EOF
    print_success "Created .env.local with default values"
else
    print_success ".env.local exists"
fi

# Create uploads directory if it doesn't exist
print_status "Checking uploads directory..."
if [ ! -d "uploads" ]; then
    mkdir -p uploads
    print_success "Created uploads directory"
else
    print_success "Uploads directory exists"
fi

# Start development server
print_status "Starting development server..."
print_success "Server will start at http://localhost:3000"
print_warning "Press Ctrl+C to stop the server"
echo ""

# Run development server
npm run dev