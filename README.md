GTX Core - Sistem Ujian Online
Sistem ujian online terpadu dengan Next.js 15, TypeScript, Prisma, dan Tailwind CSS untuk soal pilihan ganda.

🚀 Fitur Utama Real/Dummy
Untuk Guru
Dashboard Komprehensif - Kelola semua aspek ujian dari satu tempat
Upload Ujian PDF - Upload file PDF soal ujian tanpa syarat
Kunci Jawaban - Atur kunci jawaban bersamaan saat upload (template Excel)
Manajemen Siswa - Upload data siswa per kelas dengan template Excel
Hasil Ujian - Lihat hasil per siswa dan export ke Excel
Registrasi Guru - Sistem pendaftaran guru baru
Login Aman - Sistem autentikasi dengan JWT token
Untuk Siswa
Login Sederhana - Login dengan kode ujian dan NISN
PDF Fullscreen - Lihat soal ujian dalam format PDF
Lembar Jawaban Digital - Interface radio button untuk pilihan A/B/C/D/E
Navigasi Soal - Pindah antar soal dengan mudah
Timer Otomatis - Penghitung waktu otomatis
Hasil Instan - Tampilkan skor setelah selesai
📋 Persyaratan Sistem
Node.js 15+
npm
SQLite (included)
🛠️ Instalasi
Clone repository
Install dependencies:
bash

Line Wrapping

Collapse
Copy
1
npm install
Setup database:
bash

Line Wrapping

Collapse
Copy
1
npm run db:push
Jalankan development server:
bash

Line Wrapping

Collapse
Copy
1
npm run dev
Buka http://localhost:3000 di browser
📁 Template Upload
Template Data Siswa
Format file Excel (.xls/.xlsx):

Kolom A: NISN (wajib, unik)
Kolom B: NAMA LENGKAP (wajib)
Kolom C: KELAS (wajib, contoh: XII-A)
Template Kunci Jawaban
Format file Excel (.xls/.xlsx):

Kolom A: Nomor Soal (1, 2, 3, ...)
Kolom B: Jawaban (A, B, C, D, atau E)
🎯 Cara Penggunaan
Guru
Registrasi Akun - Daftar akun guru baru melalui halaman registrasi
Login - Masuk menggunakan email dan password
Upload Data Siswa - Upload file Excel data siswa terlebih dahulu
Upload Ujian - Upload PDF soal dan file kunci jawaban
Monitor Hasil - Lihat hasil ujian siswa di dashboard
Siswa
Login - Gunakan kode ujian dan NISN yang terdaftar
Kerjakan Ujian - Lihat PDF soal dan jawab melalui interface digital
Submit Jawaban - Klik submit setelah selesai
Lihat Hasil - Skor ditampilkan langsung setelah submit
🔧 Konfigurasi
Environment Variables
Buat file .env.local:

env

Line Wrapping

Collapse
Copy
1
2
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-here"
🎨 Desain
Tema: Biru abu-abu muda yang elegan
Responsive: Mobile-friendly design
Minimal Scroll: Interface yang compact dan efisien
Anti Cheat: PDF viewer dengan kontrol navigasi terbatas
📊 Struktur Database
Guru
id, email, password, name, createdAt, updatedAt
Siswa
id, nisn, nama, kelas, createdAt, updatedAt
Ujian
id, kodeUjian, namaUjian, kelas, jumlahSoal, lamaUjian, tipePilihan, pdfPath, kunciJawaban, guruId, createdAt, updatedAt
HasilUjian
id, ujianId, siswaId, jawaban, skor, benar, salah, waktuMulai, waktuSelesai, createdAt, updatedAt
🔐 Keamanan
Password hashing dengan bcryptjs
JWT token untuk autentikasi
Validasi input server-side
Role-based access control
📝 Catatan
Sistem dirancang khusus untuk soal pilihan ganda
File PDF soal ditampilkan apa adanya tanpa modifikasi
Kunci jawaban diupload bersamaan dengan soal
Login siswa memvalidasi kelas dan NISN
Hasil ujian tidak bisa diubah setelah submit
🐛 Troubleshooting
Error: Module not found
bash

Line Wrapping

Collapse
Copy
1
npm install bcryptjs jsonwebtoken xlsx
Database tidak terupdate
bash

Line Wrapping

Collapse
Copy
1
npm run db:push
Server tidak berjalan
bash

Line Wrapping

Collapse
Copy
1
npm run dev
© 2024 GTX Core - 083895603395 eswepe11@gmail.com

