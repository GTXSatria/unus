// src/app/api/ujian/start/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers' // --- IMPORT HELPER COOKIES --- // --- IMPORT HELPER COOKIES ---

// YANG BARU DAN KONSISTEN
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// --- KOREKSI KEAMANAN: Fungsi verifikasi token dari HttpOnly cookie ---
async function verifySiswaToken(request: NextRequest) {
  // Baca cookie dari request menggunakan helper Next.js
  const cookieStore = await cookies()
  const token = cookieStore.get('siswaToken')?.value

  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    if (decoded.role !== 'siswa') {
      return null
    }
    return decoded
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verifikasi token (sekarang membaca dari cookie)
    const siswa = await verifySiswaToken(request)
    if (!siswa) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if student already has a start time record
    const existingStartTime = await db.hasilUjian.findFirst({
      where: {
        ujianId: siswa.ujianId,
        siswaId: siswa.id,
        waktuSelesai: null // Only get records that haven't been finished
      }
    })

    if (existingStartTime) {
      // Student already started, return the existing start time
      return NextResponse.json({
        message: 'Siswa sudah mulai ujian',
        waktuMulai: existingStartTime.waktuMulai,
        sudahMulai: true
      })
    }

    // Create new start time record
    const startTime = new Date()
    const hasil = await db.hasilUjian.create({
      data: {
        ujianId: siswa.ujianId,
        siswaId: siswa.id,
        jawaban: JSON.stringify({}), // Empty answers initially
        skor: 0,
        benar: 0,
        salah: 0,
        waktuMulai: startTime,
        waktuSelesai: null // Will be set when submitted
      }
    })

return NextResponse.json({
  message: 'Waktu mulai dicatat',
  waktuMulai: hasil.waktuMulai,
  sudahMulai: false
}, {
  // --- TAMBAHKAN OBJECT headers INI ---
  headers: {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
})

  } catch (error) {
    console.error('Start ujian error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}