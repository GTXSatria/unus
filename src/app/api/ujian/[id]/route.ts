// src/app/api/ujian/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import * as XLSX from 'xlsx' // <-- IMPORT XLSX UNTUK PARSE KUNCI JAWABAN
import { createClient } from '@supabase/supabase-js' // <-- IMPORT SUPABASE

// YANG BARU DAN KONSISTEN
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// INISIALISASI SUPABASE CLIENT
const supabase = createClient(
  process.env.NEXT_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// --- TAMBAHKAN KONSTANTA INI UNTUK MENJAGA KODE RAPI ---
const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
}

// --- Fungsi verifikasi token dari HttpOnly cookie ---
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guru = await verifyGuruToken(request)
    if (!guru) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id: ujianId } = await params

    const ujian = await db.ujian.findFirst({
      where: { id: ujianId, guruId: guru.id }
    })

    if (!ujian) {
      return NextResponse.json({ message: 'Ujian tidak ditemukan atau Anda tidak memiliki akses' }, { status: 404, headers: noCacheHeaders })
    }

    return NextResponse.json(ujian, { headers: noCacheHeaders })
  } catch (error) {
    console.error('Get ujian detail error:', error)
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500, headers: noCacheHeaders })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guru = await verifyGuruToken(request)
    if (!guru) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401, headers: noCacheHeaders })
    }

    const { id: ujianId } = await params
    const formData = await request.formData()

    const kodeUjian = formData.get('kodeUjian') as string
    const namaUjian = formData.get('namaUjian') as string
    const kelas = formData.get('kelas') as string
    const jumlahSoal = parseInt(formData.get('jumlahSoal') as string)
    const lamaUjian = parseInt(formData.get('lamaUjian') as string)
    const tipePilihan = formData.get('tipePilihan') as string
    const pdfFile = formData.get('pdfFile') as File | null
    const kunciFile = formData.get('kunciFile') as File | null

    if (!kodeUjian || !namaUjian || !kelas || !jumlahSoal || !lamaUjian || !tipePilihan) {
      return NextResponse.json({ message: 'Semua field harus diisi' }, { status: 400, headers: noCacheHeaders })
    }

    const existingUjian = await db.ujian.findFirst({
      where: { id: ujianId, guruId: guru.id }
    })

    if (!existingUjian) {
      return NextResponse.json({ message: 'Ujian tidak ditemukan atau Anda tidak memiliki akses' }, { status: 404, headers: noCacheHeaders })
    }

    const duplicateUjian = await db.ujian.findFirst({
      where: { kodeUjian: kodeUjian, guruId: guru.id, id: { not: ujianId } }
    })

    if (duplicateUjian) {
      return NextResponse.json({ message: 'Kode ujian sudah digunakan' }, { status: 400, headers: noCacheHeaders })
    }

    const updateData: any = {
      kodeUjian: kodeUjian,
      namaUjian,
      kelas,
      jumlahSoal,
      lamaUjian,
      tipePilihan
    }

    // --- KOREKSI: Handle PDF file update ke Supabase ---
    if (pdfFile) {
      const pdfBytes = await pdfFile.arrayBuffer()
      const pdfBuffer = Buffer.from(pdfBytes)
      
      const pdfStoragePath = `${guru.id}/${kelas}/${kodeUjian}.pdf`

      const { error: uploadError } = await supabase.storage
        .from('soal-ujian')
        .upload(pdfStoragePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true // <-- TIMPA FILE LAMA JIKA ADA
        })

      if (uploadError) {
        console.error('Gagal update PDF ke Supabase:', uploadError)
        return NextResponse.json({ message: 'Gagal mengupdate file PDF.' }, { status: 500, headers: noCacheHeaders })
      }

      updateData.pdfPath = pdfStoragePath
    }

    // --- KOREKSI: Handle kunci jawaban file update ---
    if (kunciFile) {
      const kunciBytes = await kunciFile.arrayBuffer()
      const kunciBuffer = Buffer.from(kunciBytes)
      const workbook = XLSX.read(kunciBuffer)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

      const kunciJawaban: Record<string, string> = {}
      jsonData.forEach((row: any) => {
        const nomor = String(row.Nomor || row.nomor || row.NO || row.no)
        const jawaban = String(row.Jawaban || row.jawaban || row.JAWABAN || row.jawaban)
        if (nomor && jawaban) {
          kunciJawaban[nomor] = jawaban.toUpperCase()
        }
      })

      if (Object.keys(kunciJawaban).length !== jumlahSoal) {
        return NextResponse.json(
          { message: `Jumlah kunci jawaban (${Object.keys(kunciJawaban).length}) tidak sesuai dengan jumlah soal (${jumlahSoal})` },
          { status: 400, headers: noCacheHeaders }
        )
      }

      updateData.kunciJawaban = JSON.stringify(kunciJawaban) // <-- SIMPAN JSON, BUKAN PATH
    }

    const updatedUjian = await db.ujian.update({
      where: { id: ujianId },
      data: updateData
    })

    return NextResponse.json(updatedUjian, { headers: noCacheHeaders })
  } catch (error) {
    console.error('Update ujian error:', error)
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500, headers: noCacheHeaders })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guru = await verifyGuruToken(request)
    if (!guru) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401, headers: noCacheHeaders }
      )
    }

    const { id: ujianId } = await params

    const ujian = await db.ujian.findFirst({
      where: { id: ujianId, guruId: guru.id }
    })

    if (!ujian) {
      return NextResponse.json(
        { message: 'Ujian tidak ditemukan atau Anda tidak memiliki akses' },
        { status: 404, headers: noCacheHeaders }
      )
    }

    // --- Hapus file dari Supabase sebelum hapus record ---
    if (ujian.pdfPath) {
      const { error: deleteError } = await supabase.storage
        .from('soal-ujian')
        .remove([ujian.pdfPath])

      if (deleteError) {
        console.error('Gagal menghapus file dari storage.')
      }
    }

    // --- Hapus record ujian dari database ---
    await db.ujian.delete({
      where: { id: ujianId }
    })

    return NextResponse.json(
      { message: 'Ujian berhasil dihapus' },
      { headers: noCacheHeaders }
    )
  } catch (error) {
    if (error instanceof Error) {
      console.error('Delete ujian gagal:', error.message)
    } else {
      console.error('Delete ujian gagal: error tidak dikenal')
    }
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500, headers: noCacheHeaders }
    )
  }
}
