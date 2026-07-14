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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guru = await verifyGuruToken(request)
    if (!guru) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: siswaId } = await params

    // Cek apakah siswa milik guru ini
    const siswa = await db.siswa.findUnique({
      where: { id: siswaId }
    })

    if (!siswa || siswa.guruId !== guru.id) {
      return NextResponse.json(
        { message: 'Siswa tidak ditemukan atau tidak memiliki akses' },
        { status: 404 }
      )
    }

    // Hapus semua hasil ujian siswa
    await db.hasilUjian.deleteMany({
      where: { siswaId }
    })

    // Hapus siswa
    await db.siswa.delete({
      where: { id: siswaId }
    })

    return NextResponse.json({
      message: 'Siswa berhasil dihapus'
    })
  } catch (error) {
    console.error('Delete siswa error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}