import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { createClient } from '@supabase/supabase-js' // <-- 1. IMPORT SUPABASE CLIENT

// Inisialisasi Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ kodeUjian: string }> }
) {
  try {
    const { kodeUjian } = await params

    // Cari ujian berdasarkan kode
    const ujian = await db.ujian.findFirst({
      where: {
        kodeUjian: kodeUjian
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

    // --- MODIFIKASI UTAMA: DOWNLOAD PDF DARI SUPABASE STORAGE ---

    // 2. GUNAKAN SUPABASE CLIENT UNTUK MENGUNDUH FILE
    const { data: pdfData, error } = await supabase.storage
      .from('soal-ujian') // <-- NAMA BUCKET
      .download(ujian.pdfPath) // <-- pdfPath adalah path yang disimpan di DB (misal: 'guruId/Kelas/kodeUjian.pdf')

    // 3. CEK JIKA DOWNLOAD GAGAL
    if (error || !pdfData) {
      console.error('Gagal mengambil PDF dari Supabase:', error)
      return new Response(
        JSON.stringify({ message: 'Gagal mengambil file PDF dari server.' }),
        { status: 500 }
      )
    }

    // 4. KONVERSI DATA YANG DIDAPAT DARI SUPABASE
    // `pdfData` dari Supabase adalah objek Blob. Kita perlu mengubahnya menjadi ArrayBuffer atau Uint8Array.
    const arrayBuffer = await pdfData.arrayBuffer()
    const pdfUint8Array = new Uint8Array(arrayBuffer)

    // 5. KEMBALIKAN RESPONSE PDF
    return new Response(pdfUint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${ujian.namaUjian}.pdf"`
      }
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