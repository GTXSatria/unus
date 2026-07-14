// src/app/api/ujian/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers' // --- IMPORT HELPER COOKIES ---

// YANG BARU DAN KONSISTEN
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// INISIALISASI SUPABASE CLIENT (GUNAKAN SERVICE ROLE UNTUK OPERASI SERVER)
const supabase = createClient(
  process.env.NEXT_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// --- KOREKSI KEAMANAN: Fungsi verifikasi token dari HttpOnly cookie ---
async function verifyGuruToken(request: NextRequest) {
  // Baca cookie dari request menggunakan helper Next.js
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

export async function POST(request: NextRequest) {
  try {
    // Verifikasi token (sekarang membaca dari cookie)
    const guru = await verifyGuruToken(request)
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

    // --- MODIFIKASI UTAMA: UPLOAD KE SUPABASE STORAGE ---

    // SIAPKAN FILE PDF UNTUK DIUPLOAD
    const pdfBytes = await pdfFile.arrayBuffer()
    const pdfBuffer = Buffer.from(pdfBytes)
    
    // BUAT PATH UNTUK FILE DI BUCKET SESUAI STRUKTUR YANG DIINGINKAN
    const pdfStoragePath = `${guru.id}/${kelas}/${kodeUjian}.pdf`

    // UPLOAD FILE PDF KE BUCKET 'Soal-ujian'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('soal-ujian') // NAMA BUCKET
      .upload(pdfStoragePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false // Jangan timpa jika file sudah ada
      })

    // CEK JIKA UPLOAD GAGAL
    if (uploadError) {
      console.error('Gagal upload PDF ke Supabase:', uploadError)
      return NextResponse.json(
        { message: 'Gagal mengupload file PDF ke server.', error: uploadError.message },
        { status: 500 }
      )
    }

    // --- AKHIR MODIFIKASI UPLOAD ---

    // Proses file kunci jawaban (Excel) - TIDAK ADA PERUBAHAN DI SINI
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
        pdfPath: pdfStoragePath, // SIMPAN PATH DARI SUPABASE STORAGE
        kunciJawaban: JSON.stringify(kunciJawaban), // UBAH MENJADI STRING JSON
        guruId: guru.id
      }
    })

    return NextResponse.json({
  message: 'Ujian berhasil diupload',
  ujian
}, {
  // --- TAMBAHKAN OBJECT headers INI ---
  headers: {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
})
  } catch (error) {
    console.error('Upload ujian error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}