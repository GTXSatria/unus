// src/app/api/auth/login-siswa/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

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

    // --- KOREKSI KEAMANAN: Gunakan HttpOnly Cookie ---
    // Kita tidak lagi mengirim token di body JSON untuk mencegah pencurian via XSS.
    // Sebagai gantinya, kita simpan token di HttpOnly cookie yang lebih aman.

    const response = NextResponse.json({
      message: 'Login berhasil',
      // Token DIHAPUS dari sini
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
    });

    // Set cookie dengan token
    response.cookies.set({
      name: 'siswaToken', // Nama cookie berbeda untuk membedakan
      value: token,       // Nilai token
      httpOnly: true,     // Penting: Tidak bisa diakses via JavaScript
      secure: process.env.NODE_ENV === 'production', // Hanya kirim via HTTPS
      sameSite: 'strict', // Perlindungan dari CSRF
      maxAge: 60 * 60 * 24, // Umur cookie: 1 hari
      path: '/',          // Cookie berlaku untuk seluruh situs
    });

    return response;

  } catch (error) {
    // console.error aman digunakan untuk logging error di server
    console.error('Login siswa error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}