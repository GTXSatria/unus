import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function verifyGuruToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const guru = verifyGuruToken(request)
    if (!guru) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const ujianId = params.id
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { message: 'File harus diupload' },
        { status: 400 }
      )
    }

    // Cek apakah ujian milik guru ini
    const ujian = await db.ujian.findFirst({
      where: {
        id: ujianId,
        guruId: guru.id
      }
    })

    if (!ujian) {
      return NextResponse.json(
        { message: 'Ujian tidak ditemukan' },
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

    // Parse CSV
    const kunciJawaban: Record<string, string> = {}
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const [nomor, jawaban] = line.split(',').map(s => s.trim().replace(/"/g, ''))
      
      if (nomor && jawaban) {
        const nomorInt = parseInt(nomor)
        if (!isNaN(nomorInt) && nomorInt >= 1 && nomorInt <= ujian.jumlahSoal) {
          // Validate jawaban
          const validJawaban = ujian.tipePilihan.split('')
          if (validJawaban.includes(jawaban.toUpperCase())) {
            kunciJawaban[nomorInt] = jawaban.toUpperCase()
          } else {
            return NextResponse.json(
              { message: `Jawaban "${jawaban}" tidak valid untuk soal nomor ${nomorInt}. Pilihan yang tersedia: ${validJawaban.join(', ')}` },
              { status: 400 }
            )
          }
        }
      }
    }

    // Validasi jumlah kunci jawaban
    if (Object.keys(kunciJawaban).length !== ujian.jumlahSoal) {
      return NextResponse.json(
        { message: `Jumlah kunci jawaban (${Object.keys(kunciJawaban).length}) tidak sesuai dengan jumlah soal (${ujian.jumlahSoal})` },
        { status: 400 }
      )
    }

    // Update kunci jawaban
    const updatedUjian = await db.ujian.update({
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