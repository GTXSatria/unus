// src/app/api/ujian/pdf/[kodeUjian]/route.ts
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

// Pastikan environment variable ada, kalau tidak throw error
const SUPABASE_URL = process.env.NEXT_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Supabase environment variables missing')
}

// Inisialisasi Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function verifySiswaToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    if (decoded.role !== 'siswa') return null
    return decoded
  } catch {
    return null
  }
}

// ✅ PERUBAHAN PADA BARIS INI
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ kodeUjian: string }> } // Tipe params sekarang Promise
) {
  try {
    // ✅ TAMBAHKAN `await` DI SINI
    const { kodeUjian } = await params

    // Verifikasi token
    const siswa = verifySiswaToken(request)
    if (!siswa) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Cari ujian di DB
    const ujian = await db.ujian.findFirst({ where: { kodeUjian } })

    if (!ujian || !ujian.pdfPath) {
      return new Response(JSON.stringify({ message: 'PDF tidak ditemukan' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Download PDF dari Supabase Storage
    const { data: pdfData, error } = await supabase.storage
      .from('soal-ujian')
      .download(ujian.pdfPath)

    if (error || !pdfData) {
      console.error('Gagal mengambil PDF dari Supabase:', error)
      return new Response(
        JSON.stringify({ message: 'Gagal mengambil file PDF dari server.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Konversi ke Uint8Array
    const arrayBuffer = await pdfData.arrayBuffer()
    const pdfUint8Array = new Uint8Array(arrayBuffer)

    return new Response(pdfUint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${ujian.namaUjian}.pdf"`,
      },
    })
  } catch (err) {
    console.error('Get PDF error:', err)
    return new Response(JSON.stringify({ message: 'Terjadi kesalahan server' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}