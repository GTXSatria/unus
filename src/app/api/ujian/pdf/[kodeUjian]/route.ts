import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ kodeUjian: string }> }
) {
  try {
    const { kodeUjian } = await params

    // Cari ujian berdasarkan kode (case-insensitive)
    const ujian = await db.ujian.findFirst({
      where: {
        kodeUjian: kodeUjian.toLowerCase()
      }
    })

    if (!ujian || !ujian.pdfPath) {
      return new Response(
        JSON.stringify({ message: 'PDF tidak ditemukan' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Baca file PDF
    const pdfBuffer = await readFile(ujian.pdfPath)

    // Fix: Konversi Buffer ke Uint8Array untuk kompatibilitas dengan BodyInit
    const pdfUint8Array = new Uint8Array(pdfBuffer)

    // Gunakan Response native untuk mengembalikan PDF
    return new Response(pdfUint8Array, {
      status: 200,
      headers: new Headers({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${ujian.namaUjian}.pdf"`
      })
    })
  } catch (error) {
    console.error('Get PDF error:', error)
    return new Response(
      JSON.stringify({ message: 'Terjadi kesalahan server' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}