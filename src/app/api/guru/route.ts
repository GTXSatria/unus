// src/app/api/guru/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Helper Verifikasi Token Admin (sama seperti di API pesan admin)
async function verifyAdminToken(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('guruToken')?.value

  if (!token) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    if (decoded.role !== 'guru') return null

    const guru = await db.guru.findUnique({
      where: { id: decoded.id },
      select: { role: true }
    });

    if (guru?.role !== 'ADMIN') return null
    
    return decoded
  } catch {
    return null
  }
}

// GET: Admin mengambil daftar semua guru
export async function GET(request: NextRequest) {
  const admin = await verifyAdminToken(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const guruList = await db.guru.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(guruList);

  } catch (error) {
    console.error('Get guru list error:', error)
    return NextResponse.json({ error: 'Gagal mengambil daftar guru' }, { status: 500 })
  }
}