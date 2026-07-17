// src/app/api/ujian/[id]/kunci-jawaban/upload/route.ts
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

// Helper: parse jawaban dari CSV — support "A" (single) atau "A-C-E" (ganda, dash-separated)
function parseJawabanCSV(raw: string): string[] {
  const cleaned = raw.replace(/"/g, '').trim().toUpperCase()
  if (!cleaned) return []

  // Jika ada dash → ganda (contoh: "A-C-E")
  if (cleaned.includes('-')) {
    return cleaned.split('-').map(s => s.trim()).filter(Boolean)
  }

  // Jika ada koma → ganda dalam quote CSV (contoh: "A,C,E")
  if (cleaned.includes(',')) {
    return cleaned.split(',').map(s => s.trim()).filter(Boolean)
  }

  // Single
  return [cleaned]
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const guru = await verifyGuruToken(request)
    if (!guru) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const ujianId = id
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { message: 'File harus diupload' },
        { status: 400 }
      )
    }

    // Cek apakah ujian milik guru ini (IDOR Prevention)
    const ujian = await db.ujian.findFirst({
      where: {
        id: ujianId,
        guruId: guru.id
      }
    })

    if (!ujian) {
      return NextResponse.json(
        { message: 'Ujian tidak ditemukan atau Anda tidak memiliki akses' },
        { status: 404 }
      )
    }

    // Proses file CSV
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())

    if (lines.length < 2) {
      return NextResponse.json(
        { message: 'File CSV tidak valid atau kosong' },
        { status: 400 }
      )
    }

    const validOptions = ujian.tipePilihan.split('')
    const kunciJawaban: Record<string, string> = {}

    // Skip header row (index 0)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Split hanya di koma pertama: "3,A-C-E" → nomor="3", jawabanRaw="A-C-E"
      const idx = line.indexOf(',')
      if (idx === -1) continue

      const nomorStr = line.substring(0, idx).trim()
      const jawabanRaw = line.substring(idx + 1).trim()

      if (!nomorStr || !jawabanRaw) continue

      const nomorInt = parseInt(nomorStr)
      if (isNaN(nomorInt) || nomorInt < 1 || nomorInt > ujian.jumlahSoal) continue

      // Parse jawaban (support single "A" atau ganda "A-C-E")
      const letters = parseJawabanCSV(jawabanRaw)

      if (letters.length === 0) continue

      // Validasi setiap huruf
      for (const letter of letters) {
        if (!validOptions.includes(letter)) {
          return NextResponse.json(
            {
              message: `Jawaban "${letter}" tidak valid untuk soal nomor ${nomorInt}. Pilihan yang tersedia: ${validOptions.join(', ')}`
            },
            { status: 400 }
          )
        }
      }

      // Simpan sebagai koma-separated, sorted: "A,C,E"
      kunciJawaban[nomorInt] = [...letters].sort().join(',')
    }

    // Validasi jumlah kunci jawaban
    if (Object.keys(kunciJawaban).length !== ujian.jumlahSoal) {
      return NextResponse.json(
        {
          message: `Jumlah kunci jawaban (${Object.keys(kunciJawaban).length}) tidak sesuai dengan jumlah soal (${ujian.jumlahSoal})`
        },
        { status: 400 }
      )
    }

    // Update kunci jawaban
    await db.ujian.update({
      where: { id: ujianId },
      data: {
        kunciJawaban: JSON.stringify(kunciJawaban)
      }
    })

    return NextResponse.json({
      message: 'Kunci jawaban berhasil diupload',
      kunciJawaban
    })
  } catch (error) {
    console.error('Upload kunci jawaban error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}