import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    console.log('=== LOGIN SISWA API CALLED ===')
    
    const { kodeUjian, nisn } = await request.json()
    
    console.log('Request data:', { kodeUjian, nisn })
    console.log('DATABASE_URL:', process.env.DATABASE_URL)

    if (!kodeUjian || !nisn) {
      console.log('Validation error: Missing fields')
      return NextResponse.json(
        { message: 'Kode ujian dan NISN harus diisi' },
        { status: 400 }
      )
    }

    console.log('Searching for ujian with kode:', kodeUjian.toLowerCase())

    // Cari ujian berdasarkan kode (case-insensitive)
    const ujian = await db.ujian.findFirst({
      where: {
        kodeUjian: kodeUjian.toLowerCase()
      }
    })

    console.log('Found ujian:', ujian)

    if (!ujian) {
      console.log('Ujian not found')
      return NextResponse.json(
        { message: 'Kode ujian tidak valid' },
        { status: 404 }
      )
    }

    console.log('Searching for siswa with NISN:', nisn, 'and guruId:', ujian.guruId)

    // Cari siswa berdasarkan NISN dan guruId dari ujian
    const siswa = await db.siswa.findFirst({
      where: {
        nisn: nisn,
        guruId: ujian.guruId
      }
    })

    console.log('Found siswa:', siswa)

    if (!siswa) {
      console.log('Siswa not found')
      return NextResponse.json(
        { message: 'NISN tidak terdaftar' },
        { status: 404 }
      )
    }

    console.log('Validating kelas - siswa:', siswa.kelas, 'ujian:', ujian.kelas)

    // Validasi kelas (case-insensitive)
    if (siswa.kelas.toLowerCase() !== ujian.kelas.toLowerCase()) {
      console.log('Kelas tidak sesuai')
      return NextResponse.json(
        { 
          message: 'Kelas tidak sesuai',
          detail: `Kelas siswa: ${siswa.kelas}, Kelas ujian: ${ujian.kelas}`
        },
        { status: 404 }
      )
    }

    console.log('Generating JWT token')

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

    console.log('Login successful')

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
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
    return NextResponse.json(
      { message: 'Terjadi kesalahan server: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}