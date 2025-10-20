import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const { kodeUjian, nisn } = await request.json()

    if (!kodeUjian || !nisn) {
      return NextResponse.json(
        { message: 'Kode ujian dan NISN harus diisi' },
        { status: 400 }
      )
    }

    // Cari ujian berdasarkan kode (case-insensitive)
    const ujian = await db.ujian.findFirst({
      where: {
        kodeUjian: kodeUjian
      }
    })

    if (!ujian) {
      return NextResponse.json(
        { message: 'Kode ujian tidak valid' },
        { status: 404 }
      )
    }

    // Cari siswa berdasarkan NISN dan guruId dari ujian
    const siswa = await db.siswa.findFirst({
      where: {
        nisn: nisn,
        guruId: ujian.guruId
      }
    })

    if (!siswa) {
      return NextResponse.json(
        { message: 'NISN tidak terdaftar' },
        { status: 404 }
      )
    }

    // Validasi kelas (case-insensitive)
    if (siswa.kelas.toLowerCase() !== ujian.kelas.toLowerCase()) {
      return NextResponse.json(
        { 
          message: 'Kelas tidak sesuai',
          detail: `Kelas siswa: ${siswa.kelas}, Kelas ujian: ${ujian.kelas}`
        },
        { status: 404 }
      )
    }

    // Generate JWT token untuk siswa
    const token = jwt.sign(
      { 
        id: siswa.id, 
        nisn: siswa.nisn, 
        kelas: siswa.kelas,
        guruId: siswa.guruId,
        ujianId: ujian.id,
        role: 'siswa' 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    return NextResponse.json({
      message: 'Login berhasil',
      token,
      siswa: {
        id: siswa.id,
        nisn: siswa.nisn,
        nama: siswa.nama,
        kelas: siswa.kelas
      },
      ujian: {
        id: ujian.id,
        kodeUjian: ujian.kodeUjian,
        namaUjian: ujian.namaUjian,
        jumlahSoal: ujian.jumlahSoal,
        lamaUjian: ujian.lamaUjian,
        tipePilihan: ujian.tipePilihan
      }
    })
  } catch (error) {
    console.error('Login siswa error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}