import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import jwt from 'jsonwebtoken'
// YANG BARU DAN KONSISTEN
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guru = verifyGuruToken(request)
    if (!guru) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: ujianId } = await params

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

    return NextResponse.json(ujian)
  } catch (error) {
    console.error('Get ujian detail error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guru = verifyGuruToken(request)
    if (!guru) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
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

    // Validasi input
    if (!kodeUjian || !namaUjian || !kelas || !jumlahSoal || !lamaUjian || !tipePilihan) {
      return NextResponse.json(
        { message: 'Semua field harus diisi' },
        { status: 400 }
      )
    }

    // Cek apakah ujian milik guru ini
    const existingUjian = await db.ujian.findFirst({
      where: {
        id: ujianId,
        guruId: guru.id
      }
    })

    if (!existingUjian) {
      return NextResponse.json(
        { message: 'Ujian tidak ditemukan' },
        { status: 404 }
      )
    }

    // Cek duplikasi kode ujian (kecuali ujian itu sendiri)
    const duplicateUjian = await db.ujian.findFirst({
      where: {
        kodeUjian: kodeUjian.toUpperCase(),
        guruId: guru.id,
        id: { not: ujianId }
      }
    })

    if (duplicateUjian) {
      return NextResponse.json(
        { message: 'Kode ujian sudah digunakan' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      kodeUjian: kodeUjian.toUpperCase(),
      namaUjian,
      kelas,
      jumlahSoal,
      lamaUjian,
      tipePilihan
    }

    // Handle PDF file update
    if (pdfFile) {
      const pdfBytes = await pdfFile.arrayBuffer()
      const pdfBuffer = Buffer.from(pdfBytes)
      
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'pdf')
      await mkdir(uploadsDir, { recursive: true })
      
      const pdfFileName = `${kodeUjian.toUpperCase()}_${Date.now()}.pdf`
      const pdfPath = path.join(uploadsDir, pdfFileName)
      
      await writeFile(pdfPath, pdfBuffer)
      updateData.pdfPath = `/uploads/pdf/${pdfFileName}`
    }

    // Handle kunci jawaban file update
    if (kunciFile) {
      const kunciBytes = await kunciFile.arrayBuffer()
      const kunciBuffer = Buffer.from(kunciBytes)
      
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'kunci')
      await mkdir(uploadsDir, { recursive: true })
      
      const kunciFileName = `${kodeUjian.toUpperCase()}_${Date.now()}.xlsx`
      const kunciPath = path.join(uploadsDir, kunciFileName)
      
      await writeFile(kunciPath, kunciBuffer)
      updateData.kunciJawabanPath = `/uploads/kunci/${kunciFileName}`
      
      // TODO: Parse Excel file dan extract kunci jawaban
      // Untuk sekarang, simpan path saja
    }

    // Update ujian
    const updatedUjian = await db.ujian.update({
      where: { id: ujianId },
      data: updateData
    })

    return NextResponse.json(updatedUjian)
  } catch (error) {
    console.error('Update ujian error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guru = verifyGuruToken(request)
    if (!guru) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: ujianId } = await params

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

    // Hapus ujian
    await db.ujian.delete({
      where: { id: ujianId }
    })

    return NextResponse.json({ message: 'Ujian berhasil dihapus' })
  } catch (error) {
    console.error('Delete ujian error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}