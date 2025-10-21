import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
// YANG BARU DAN KONSISTEN
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ kelas: string }> }
) {
  try {
    // console.log('=== DELETE HASIL UJIAN BY KELAS API CALLED ===')
    
    const { kelas } = await params
    const guru = verifyGuruToken(request)
    
    if (!guru) {
      // console.log('Unauthorized access attempt')
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // console.log('Deleting hasil ujian for kelas:', kelas, 'by guru:', guru.id)

    // Cari semua ujian untuk guru ini dengan kelas tertentu
    const ujians = await db.ujian.findMany({
      where: {
        kelas: kelas,
        guruId: guru.id
      },
      select: {
        id: true
      }
    })

    // console.log('Found ujians for kelas:', ujians.length)

    if (ujians.length === 0) {
      return NextResponse.json(
        { message: `Tidak ada ujian untuk kelas ${kelas}` },
        { status: 404 }
      )
    }

    // Hapus semua hasil ujian untuk ujian-ujian tersebut
    const ujianIds = ujians.map(ujian => ujian.id)
    
    const result = await db.hasilUjian.deleteMany({
      where: {
        ujianId: {
          in: ujianIds
        }
      }
    })

    // console.log('Deleted hasil ujian count:', result.count)

    return NextResponse.json({
      message: `Berhasil menghapus ${result.count} hasil ujian dari kelas ${kelas}`,
      deletedCount: result.count
    })
  } catch (error) {
    console.error('Delete hasil ujian by kelas error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}