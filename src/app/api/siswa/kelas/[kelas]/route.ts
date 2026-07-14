import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
// YANG BARU DAN KONSISTEN
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function verifyGuruToken(request: NextRequest) {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ kelas: string }> }
) {
  try {
    const guru = await verifyGuruToken(request)
    if (!guru) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { kelas } = await params

    // Cari semua siswa di kelas tersebut untuk guru ini
    const siswaList = await db.siswa.findMany({
      where: { 
        kelas: kelas,
        guruId: guru.id
      },
      orderBy: { nama: 'asc' }
    })

    return NextResponse.json(siswaList)
  } catch (error) {
    console.error('Get siswa per kelas error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ kelas: string }> }
) {
  try {
    const guru = await verifyGuruToken(request)
    if (!guru) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { kelas } = await params

    // Cari semua siswa di kelas tersebut untuk guru ini
    const siswaList = await db.siswa.findMany({
      where: { 
        kelas: kelas,
        guruId: guru.id
      }
    })

    // Hapus semua hasil ujian siswa di kelas tersebut
    await db.hasilUjian.deleteMany({
      where: {
        siswaId: {
          in: siswaList.map(s => s.id)
        }
      }
    })

    // Hapus semua siswa di kelas tersebut untuk guru ini
    await db.siswa.deleteMany({
      where: { 
        kelas: kelas,
        guruId: guru.id
      }
    })

    return NextResponse.json({
      message: `Semua siswa kelas ${kelas} berhasil dihapus`
    })
  } catch (error) {
    console.error('Delete siswa per kelas error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}