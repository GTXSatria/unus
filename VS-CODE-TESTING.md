🧪 VS Code Testing Commands Reference
📋 Quick Commands List
🚀 Setup & Start
# Quick setup (recommended)
./test-setup.sh

# Manual setup local jika hapus Cache (next,node,lock)
npx next build --no-cache
npm install
npx prisma generate
npx tsc --noEmit --pretty false
npm run build
npm run dev

# jika File awal ambil dari Back up
npm install
npm install -D tailwindcss-animate
npm install -D tailwindcss postcss autoprefixer @tailwindcss/postcss
npm install dotenv
npm install @supabase/ssr
npm install @supabase/supabase-js
npm install @prisma/client
# jika ada perubahan prisma
npx prisma generate               :  WAJIB dijalankan setiap kali kamu mengubah file prisma/schema.prisma.
npx prisma db push                : HATI-HATI! Perintah ini menerapkan perubahan schema ke database. 
                                    JANGAN pernah jalankan ini jika kamu
# perintah Cek 
npx tsc --noEmit --pretty false   : Ini untuk mengecek error TypeScript. Bagus dijalankan sebelum build.
npm run lint
npm run build                     : Ini untuk membangun aplikasi versi production.
# perintah 1x di 1 komputer
npm install -g prisma
npm install -g vercel

# perintah debug
node check-env.js
node debug-local-data.js
note test-api.js
node test-setup.sh

# jalankan lokal
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database operations
npm run db:push          # Push schema to DB
npm run db:studio        # Open Prisma Studio
npx prisma generate      # Generate Prisma Client
npx prisma db push       # Alternative db push

# Run type checking
# Check for unused dependencies
npm outdated

# Audit security vulnerabilities
npm audit

# Fix audit issues
npm audit fix

# Analyze bundle size
npm run build -- --analyze

# Run Lighthouse CLI
lighthouse http://localhost:3000 --output html --output-path ./lighthouse-report.html

# Check bundle analyzer
# Debug with Chrome DevTools
# 1. Open Chrome
# 2. Go to http://localhost:3000
# 3. Press F12 or Ctrl+Shift+I
# 4. Use Sources tab for debugging
# Debug API routes
# 1. Set breakpoints in API files
# 2. Run in debug mode (F5 in VS Code)
# 3. Use "Debug Next.js" configuration
# Open Prisma Studio
npx prisma studio

pqpvqinsuxghophawnupade
# View database schema
npx prisma db pull

# Reset database (CAUTION: deletes all data)
npx prisma db push --force-reset
Ctrl + `          - Open integrated terminal
Ctrl + Shift + D  - Open debug panel
Ctrl + Shift + E  - Open file explorer
Ctrl + P          - Quick open file
Ctrl + Shift + P  - Command palette
F5                - Start/continue debugging
Shift + F5        - Stop debugging
Ctrl + /          - Toggle comment
Ctrl + S          - Save file
Ctrl + Z          - Undo
Ctrl + Y          - Redo
F9                - Toggle breakpoint
F10               - Step over
F11               - Step into
Shift + F11       - Step out
Ctrl + Shift + F5 - Restart debugging
📱 Testing URLs
http://localhost:3000              - Home page
http://localhost:3000/login/guru   - Guru login
http://localhost:3000/register/guru - Guru registration
http://localhost:3000/login/siswa  - Siswa login
http://localhost:3000/dashboard/guru - Guru dashboard
http://localhost:3000/ujian        - Siswa ujian page
API Endpoints for Testing

POST /api/auth/register           - Register guru
POST /api/auth/login              - Login guru
POST /api/auth/login-siswa        - Login siswa
GET  /api/ujian                   - Get ujian list
POST /api/ujian/upload            - Upload ujian
GET  /api/siswa                   - Get siswa list
POST /api/siswa/upload            - Upload siswa
GET  /api/hasil-ujian             - Get hasil ujian
POST /api/ujian/submit            - Submit jawaban
GET  /api/ujian/pdf/[kodeUjian]   - Get PDF soal
🛠️ Development Workflow

# 1. Start development server
npm run dev

# 2. Open VS Code in new terminal
code .

# 3. Open database viewer (optional)
npx prisma studio

# 4. Make changes and test
# 5. Run linting before commit
npm run lint
2. Before Commit
bash

# 1. Run linting
npm run lint

# 2. Run type checking
npx tsc --noEmit

# 3. Test build
npm run build

# 4. Check for security issues
npm audit
3. Testing New Features
bash

# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Implement feature
# 3. Test manually using browser
# 4. Test API endpoints with Thunder Client
# 5. Run automated tests
npm run lint

# 6. Build and test production build
npm run build
npm start
🐛 Troubleshooting Commands
Common Issues
bash
# Module not found
npm install bcryptjs jsonwebtoken xlsx

# Database connection issues
npm run db:push
npx prisma generate

# Port already in use
# Kill process on port 3000
npx kill-port 3000

# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Reset database (CAUTION!)
npx prisma db push --force-reset
Performance Issues
bash

# Check memory usage
node --inspect index.js

# Profile with Chrome DevTools
# 1. Start with --inspect
npm run dev -- --inspect

# 2. Open Chrome and go to chrome://inspect
# 3. Click "inspect" for Node.js process
📝 VS Code Tasks
Create Custom Tasks in .vscode/tasks.json
json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Development",
      "type": "shell",
      "command": "npm run dev",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "new"
      }
    },
    {
      "label": "Setup Database",
      "type": "shell",
      "command": "npm run db:push",
      "group": "build"
    },
    {
      "label": "Run Linting",
      "type": "shell",
      "command": "npm run lint",
      "group": "test"
    }
  ]
}
Run Tasks

1
Ctrl + Shift + P → "Tasks: Run Task" → Select task
🎯 Testing Checklist Commands
Pre-Testing
bash
# Check environment
node --version
npm --version

# Setup project
./test-setup.sh

# Start services
npm run dev &
npx prisma studio &
During Testing
bash
# Check logs
tail -f dev.log

# Monitor performance
top -p $(pgrep node)

# Test API endpoints
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","role":"guru"}'
Post-Testing
bash
# Generate test report
echo "# Test Report - $(date)" > test-report-$(date +%Y%m%d).md

# Clean up
pkill -f "npm run dev"
pkill -f "prisma studio"
📚 Additional Resources
Documentation
Next.js Docs
Prisma Docs
Tailwind CSS Docs
TypeScript Docs
Tools
Thunder Client - API Testing
Prisma Studio - Database GUI
Lighthouse - Performance Testing
Bundle Analyzer - Bundle Analysis
Happy Testing! 🚀
https://gtxfinal-3sc5ndcii-gtx-satrias-projects.vercel.app
setelah edit lakukan 
npm run build
git rm -r --cached .

jika ada perubahan prisma.schema lakukan 
npx prisma migrate dev --name update-schema

npm run db:generate
npm run build

Hak akses
git init
git remote add origin https://github.com/GTXSatria/unus.git
git remote set-url origin git@github.com:GTXSatria/unus.git
git rm -r --cached .
git add .
git commit -m "Push All after accidental clean"
git push origin main
git push origin main --force 
git status
git checkout main
Hapus .next lalu bisa jalan jalan hehehehehehe



pindah kamar git checkout -b fitur-panduan-guru
git checkout main 
git merge fitur-panduan-guru
git push origin main
git branch -d fitur-panduan-guru