import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
// YANG BARU DAN KONSISTEN
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

export async function POST(request: NextRequest) {
  try {
    const siswa = await verifySiswaToken(request)
    if (!siswa) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { siswaId, ujianId } = await request.json()

    if (!siswaId || !ujianId) {
      return NextResponse.json(
        { message: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    // Check if student already has a result for this exam
    const existingHasil = await db.hasilUjian.findFirst({
      where: {
        ujianId: ujianId,
        siswaId: siswaId
      },
      include: {
        ujian: {
          select: {
            jumlahSoal: true
          }
        }
      }
    })

    if (existingHasil) {
      // If exam is finished (waktuSelesai is not null), show the result
      if (existingHasil.waktuSelesai) {
        return NextResponse.json({
          hasExistingResult: true,
          hasil: {
            skor: existingHasil.skor,
            benar: existingHasil.benar,
            salah: existingHasil.salah,
            totalSoal: existingHasil.ujian.jumlahSoal
          }
        })
      } else {
        // Exam is started but not finished, return start time
        return NextResponse.json({
          hasExistingResult: false,
          sudahMulai: true,
          waktuMulai: existingHasil.waktuMulai,
          message: 'Ujian sudah dimulai, melanjutkan dari waktu tersisa'
        })
      }
    }

    return NextResponse.json({
      hasExistingResult: false
    })

  } catch (error) {
    console.error('Check existing result error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}