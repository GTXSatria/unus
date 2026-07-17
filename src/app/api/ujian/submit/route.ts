// src/app/api/ujian/submit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function verifySiswaToken(request: NextRequest) {
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

// Helper: normalize jawaban → sort alphabetically, trim, gabung koma
// "C,A,E" → "A,C,E"  |  "A" → "A"  |  undefined → ""
function normalizeJawaban(str: string | undefined): string {
  if (!str) return ''
  return str
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(Boolean)
    .sort()
    .join(',')
}

export async function POST(request: NextRequest) {
  try {
    const siswa = await verifySiswaToken(request)
    if (!siswa) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { jawaban, appSwitchCount } = await request.json()

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

    // Hitung skor — support single & multiple answer
    let benar = 0
    let salah = 0

    for (let i = 1; i <= ujian.jumlahSoal; i++) {
      const kunciNorm = normalizeJawaban(kunciJawaban[String(i)])

      // Skip soal yang tidak punya kunci jawaban
      if (!kunciNorm) continue

      const jawabanNorm = normalizeJawaban(jawaban[String(i)])

      if (jawabanNorm === kunciNorm) {
        benar++
      } else {
        salah++ // Termasuk: salah, kurang, kelebihan, atau tidak dijawab
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

    // Update hasil ujian
    const hasil = await db.hasilUjian.update({
      where: { id: existingHasil.id },
      data: {
        jawaban: JSON.stringify(jawaban),
        skor,
        benar,
        salah,
        appSwitchCount: appSwitchCount ?? 0,
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