import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
// YANG BARU DAN KONSISTEN
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function verifySiswaToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
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
    const siswa = verifySiswaToken(request)
    if (!siswa) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if student already has a start time record
    const existingStartTime = await db.hasilUjian.findFirst({
      where: {
        ujianId: siswa.ujianId,
        siswaId: siswa.id,
        waktuSelesai: null // Only get records that haven't been finished
      }
    })

    if (existingStartTime) {
      // Student already started, return the existing start time
      return NextResponse.json({
        message: 'Siswa sudah mulai ujian',
        waktuMulai: existingStartTime.waktuMulai,
        sudahMulai: true
      })
    }

    // Create new start time record
    const startTime = new Date()
    const hasil = await db.hasilUjian.create({
      data: {
        ujianId: siswa.ujianId,
        siswaId: siswa.id,
        jawaban: JSON.stringify({}), // Empty answers initially
        skor: 0,
        benar: 0,
        salah: 0,
        waktuMulai: startTime,
        waktuSelesai: null // Will be set when submitted
      }
    })

    return NextResponse.json({
      message: 'Waktu mulai dicatat',
      waktuMulai: hasil.waktuMulai,
      sudahMulai: false
    })

  } catch (error) {
    console.error('Start ujian error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}