// src/app/api/ujian/submit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers' // --- IMPORT HELPER COOKIES --- // --- IMPORT HELPER COOKIES ---

// YANG BARU DAN KONSISTEN
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// --- KOREKSI KEAMANAN: Fungsi verifikasi token dari HttpOnly cookie ---
async function verifySiswaToken(request: NextRequest) {
  // Baca cookie dari request menggunakan helper Next.js
  const cookieStore = await cookies()
  const token = cookieStore.get('siswaToken')?.value

  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    if (decoded.role !== 'siswa') {
      return null
    }
    return decoded
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verifikasi token (sekarang membaca dari cookie)
    const siswa = await verifySiswaToken(request)
    if (!siswa) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { jawaban } = await request.json()

    if (!jawaban) {
      return NextResponse.json(
        { message: 'Jawaban harus diisi' },
        { status: 400 }
      )
    }

    // Ambil data ujian
    const ujian = await db.ujian.findUnique({
      where: { id: siswa.ujianId }
    })

    if (!ujian) {
      return NextResponse.json(
        { message: 'Ujian tidak ditemukan' },
        { status: 404 }
      )
    }

    // Ambil kunci jawaban
    const kunciJawaban = JSON.parse(ujian.kunciJawaban as string)

    // Hitung skor
    let benar = 0
    let salah = 0

    for (let i = 1; i <= ujian.jumlahSoal; i++) {
      const jawabanSiswa = jawaban[String(i)]
      const kunci = kunciJawaban[String(i)]

      if (jawabanSiswa === kunci) {
        benar++
      } else if (jawabanSiswa && jawabanSiswa !== '') {
        salah++
      }
    }

    const skor = Math.round((benar / ujian.jumlahSoal) * 100)

    // Cek apakah siswa sudah mulai ujian ini
    let existingHasil = await db.hasilUjian.findFirst({
      where: {
        ujianId: siswa.ujianId,
        siswaId: siswa.id,
      }
    })

    if (!existingHasil) {
      // Jika tidak ada record, buat baru. Ini mungkin terjadi jika API start tidak dipanggil.
      const baru = await db.hasilUjian.create({
        data: {
          ujianId: siswa.ujianId,
          siswaId: siswa.id,
          waktuMulai: new Date(),
          jawaban: '{}',
          skor: 0,
          benar: 0,
          salah: 0,
          waktuSelesai: null
        }
      })
      existingHasil = baru
    }

    // Update hasil ujian yang sudah ada
    const hasil = await db.hasilUjian.update({
      where: { id: existingHasil.id },
      data: {
        jawaban: JSON.stringify(jawaban),
        skor,
        benar,
        salah,
        waktuSelesai: new Date()
      }
    })

    return NextResponse.json({
  message: 'Jawaban berhasil disubmit',
  hasil: {
    skor,
    benar,
    salah,
    totalSoal: ujian.jumlahSoal
  }
}, {
  // --- TAMBAHKAN OBJECT headers INI ---
  headers: {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
})

  } catch (error) {
    console.error('Submit ujian error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}