import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function verifyGuruToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
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
    const guru = verifyGuruToken(request)
    if (!guru) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const hasilUjian = await db.hasilUjian.findMany({
      where: {
        ujian: {
          guruId: guru.id
        }
      },
      include: {
        ujian: {
          select: {
            kodeUjian: true,
            namaUjian: true
          }
        },
        siswa: {
          select: {
            nisn: true,
            nama: true,
            kelas: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(hasilUjian)
  } catch (error) {
    console.error('Get hasil ujian error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}