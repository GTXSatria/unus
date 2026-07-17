// src/app/api/siswa/route.ts
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

// GET — ambil semua siswa guru
export async function GET(request: NextRequest) {
  try {
    const guru = await verifyGuruToken(request)
    if (!guru) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const siswa = await db.siswa.findMany({
      where: { guruId: guru.id },
      orderBy: [{ kelas: 'asc' }, { nama: 'asc' }]
    })

    return NextResponse.json(siswa)
  } catch (error) {
    console.error('Get siswa error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST — tambah siswa (1 atau lebih)
// Body: { siswa: [{ nisn, nama, kelas }, ...] }
export async function POST(request: NextRequest) {
  try {
    const guru = await verifyGuruToken(request)
    if (!guru) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const listSiswa: Array<{ nisn: string; nama: string; kelas: string }> = body.siswa

    if (!listSiswa || !Array.isArray(listSiswa) || listSiswa.length === 0) {
      return NextResponse.json(
        { message: 'Data siswa harus berupa array' },
        { status: 400 }
      )
    }

    // Validasi setiap data
    for (const s of listSiswa) {
      if (!s.nisn || !s.nama || !s.kelas) {
        return NextResponse.json(
          { message: `NISN, Nama, dan Kelas wajib diisi (NISN: ${s.nisn || 'kosong'})` },
          { status: 400 }
        )
      }
    }

    // Cek duplikat NISN per guru
    const existingSiswa = await db.siswa.findMany({
      where: { guruId: guru.id },
      select: { nisn: true }
    })

    const existingNisn = new Set(existingSiswa.map(s => s.nisn))
    const duplicates: string[] = []

    for (const s of listSiswa) {
      if (existingNisn.has(s.nisn)) {
        duplicates.push(s.nisn)
      }
    }

    if (duplicates.length > 0) {
      return NextResponse.json(
        { message: `NISN sudah terdaftar: ${duplicates.join(', ')}` },
        { status: 409 }
      )
    }

    // Cek duplikat dalam array yang dikirim
    const inputNisn = listSiswa.map(s => s.nisn)
    const duplicateInInput = inputNisn.filter((nisn, idx) => inputNisn.indexOf(nisn) !== idx)

    if (duplicateInInput.length > 0) {
      return NextResponse.json(
        { message: `NISN duplikat dalam data: ${[...new Set(duplicateInInput)].join(', ')}` },
        { status: 400 }
      )
    }

    // Create semua siswa
    const created = await db.siswa.createMany({
      data: listSiswa.map(s => ({
        nisn: s.nisn.trim(),
        nama: s.nama.trim(),
        kelas: s.kelas.trim(),
        guruId: guru.id
      }))
    })

    return NextResponse.json({
      message: `Berhasil menambahkan ${created.count} siswa`,
      added: created.count
    })
  } catch (error) {
    console.error('Add siswa error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}