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
    console.log('=== GET HASIL UJIAN API CALLED ===')
    
    const guru = verifyGuruToken(request)
    
    if (!guru) {
      console.log('Unauthorized access attempt')
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Fetching hasil ujian for guru:', guru.id)

    // Ambil semua hasil ujian untuk guru ini
    const hasilUjian = await db.hasilUjian.findMany({
      where: {
        ujian: {
          guruId: guru.id
        }
      },
      include: {
        ujian: {
          select: {
            id: true,
            kodeUjian: true,
            namaUjian: true,
            kelas: true
          }
        },
        siswa: {
          select: {
            id: true,
            nisn: true,
            nama: true,
            kelas: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('Found hasil ujian count:', hasilUjian.length)
    console.log('Sample hasil ujian:', hasilUjian.slice(0, 3))

    return NextResponse.json(hasilUjian)
  } catch (error) {
    console.error('Get hasil ujian error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}