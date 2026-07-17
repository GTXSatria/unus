// src/app/api/ujian/[id]/kunci-jawaban/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

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

// GET — ambil kunci jawaban
export async function GET(
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

    const { id } = await params

    const ujian = await db.ujian.findFirst({
      where: { id, guruId: guru.id },
      select: { id: true, kunciJawaban: true, jumlahSoal: true, tipePilihan: true }
    })

    if (!ujian) {
      return NextResponse.json(
        { message: 'Ujian tidak ditemukan atau Anda tidak memiliki akses' },
        { status: 404 }
      )
    }

    return NextResponse.json(ujian)
  } catch (error) {
    console.error('Get kunci jawaban error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT — simpan kunci jawaban
export async function PUT(
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

    const { id } = await params
    const { kunciJawaban } = await request.json()

    if (!kunciJawaban) {
      return NextResponse.json(
        { message: 'Data kunci jawaban harus diisi' },
        { status: 400 }
      )
    }

    // Cek apakah ujian milik guru ini (IDOR Prevention)
    const ujian = await db.ujian.findFirst({
      where: { id, guruId: guru.id }
    })

    if (!ujian) {
      return NextResponse.json(
        { message: 'Ujian tidak ditemukan atau Anda tidak memiliki akses' },
        { status: 404 }
      )
    }

    await db.ujian.update({
      where: { id },
      data: {
        kunciJawaban: JSON.stringify(kunciJawaban)
      }
    })

    return NextResponse.json({
      message: 'Kunci jawaban berhasil disimpan'
    })
  } catch (error) {
    console.error('Save kunci jawaban error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// DELETE — hapus kunci jawaban
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

    const { id } = await params

    // Cek apakah ujian milik guru ini (IDOR Prevention)
    const ujian = await db.ujian.findFirst({
      where: { id, guruId: guru.id }
    })

    if (!ujian) {
      return NextResponse.json(
        { message: 'Ujian tidak ditemukan atau Anda tidak memiliki akses' },
        { status: 404 }
      )
    }

    await db.ujian.update({
      where: { id },
      data: {
        kunciJawaban: '{}'
      }
    })

    return NextResponse.json({
      message: 'Kunci jawaban berhasil dihapus'
    })
  } catch (error) {
    console.error('Delete kunci jawaban error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}