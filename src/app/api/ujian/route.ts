// src/app/api/ujian/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers' // --- IMPORT HELPER COOKIES --- // --- IMPORT HELPER COOKIES ---

// YANG BARU DAN KONSISTEN
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// --- KOREKSI KEAMANAN: Fungsi verifikasi token dari HttpOnly cookie ---f
async function verifyGuruToken(request: NextRequest) {
  // Baca cookie dari request menggunakan helper Next.js
  const cookieStore = await cookies()
  const token = cookieStore.get('guruToken')?.value

  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    if (decoded.role !== 'guru') {
      return null
    }
    return decoded
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verifikasi token (sekarang membaca dari cookie)
    const guru = await verifyGuruToken(request)
    if (!guru) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const ujians = await db.ujian.findMany({
      where: { guruId: guru.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(ujians, {
  // --- TAMBAHKAN OBJECT headers INI ---
  headers: {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
})
  } catch (error) {
    console.error('Get ujians error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}