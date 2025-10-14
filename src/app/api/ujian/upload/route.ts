import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import * as XLSX from 'xlsx'

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

export async function POST(request: NextRequest) {
  try {
    const guru = verifyGuruToken(request)
    if (!guru) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const kodeUjian = formData.get('kodeUjian') as string
    const namaUjian = formData.get('namaUjian') as string
    const kelas = formData.get('kelas') as string
    const jumlahSoal = formData.get('jumlahSoal') as string
    const lamaUjian = formData.get('lamaUjian') as string
    const tipePilihan = formData.get('tipePilihan') as string
    const pdfFile = formData.get('pdfFile') as File
    const kunciFile = formData.get('kunciFile') as File

    if (!kodeUjian || !namaUjian || !kelas || !jumlahSoal || !lamaUjian || !tipePilihan || !pdfFile || !kunciFile) {
      return NextResponse.json(
        { message: 'Semua field harus diisi' },
        { status: 400 }
      )
    }

    // Cek apakah kode ujian sudah ada
    const existingUjian = await db.ujian.findUnique({
      where: { kodeUjian }
    })

    if (existingUjian) {
      return NextResponse.json(
        { message: 'Kode ujian sudah ada' },
        { status: 400 }
      )
    }

    // Proses file PDF
    const pdfBytes = await pdfFile.arrayBuffer()
    const pdfBuffer = Buffer.from(pdfBytes)
    
    // Buat direktori uploads jika belum ada
    const uploadsDir = path.join(process.cwd(), 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch {
      // Directory already exists
    }

    // Simpan file PDF
    const pdfFileName = `${kodeUjian}_${Date.now()}.pdf`
    const pdfPath = path.join(uploadsDir, pdfFileName)
    await writeFile(pdfPath, pdfBuffer)

    // Proses file kunci jawaban (Excel)
    const kunciBytes = await kunciFile.arrayBuffer()
    const kunciBuffer = Buffer.from(kunciBytes)
    const workbook = XLSX.read(kunciBuffer)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

    // Konversi data Excel ke format kunci jawaban
    const kunciJawaban: Record<string, string> = {}
    jsonData.forEach((row: any) => {
      const nomor = String(row.Nomor || row.nomor || row.NO || row.no)
      const jawaban = String(row.Jawaban || row.jawaban || row.JAWABAN || row.jawaban)
      if (nomor && jawaban) {
        kunciJawaban[nomor] = jawaban.toUpperCase()
      }
    })

    // Validasi jumlah kunci jawaban
    if (Object.keys(kunciJawaban).length !== parseInt(jumlahSoal)) {
      return NextResponse.json(
        { message: `Jumlah kunci jawaban (${Object.keys(kunciJawaban).length}) tidak sesuai dengan jumlah soal (${jumlahSoal})` },
        { status: 400 }
      )
    }

    // Simpan data ujian ke database
    const ujian = await db.ujian.create({
      data: {
        kodeUjian,
        namaUjian,
        kelas,
        jumlahSoal: parseInt(jumlahSoal),
        lamaUjian: parseInt(lamaUjian),
        tipePilihan,
        pdfPath: pdfPath,
        kunciJawaban: JSON.stringify(kunciJawaban),
        guruId: guru.id
      }
    })

    return NextResponse.json({
      message: 'Ujian berhasil diupload',
      ujian
    })
  } catch (error) {
    console.error('Upload ujian error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}