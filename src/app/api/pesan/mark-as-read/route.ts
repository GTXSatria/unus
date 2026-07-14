// src/app/api/pesan/mark-as-read/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

// --- Konfigurasi Supabase ---
const SUPABASE_URL = process.env.NEXT_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// --- Helper Verifikasi Token Guru ---
async function verifyGuruToken(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('guruToken')?.value

  if (!token) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    if (decoded.role !== 'guru') return null
    return decoded
  } catch {
    return null
  }
}

// --- POST: Tandai semua pesan sebagai sudah dibaca ---
export async function POST(request: NextRequest) {
  const guru = await verifyGuruToken(request)
  if (!guru) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const guruId = guru.id
    const filePath = `read-status/${guruId}.txt`

    // Upload file kosong. File ini akan berfungsi sebagai "stempel waktu".
    // Setiap kali dipanggil, updated_at-nya akan berubah.
    const { error } = await supabase.storage
      .from('pesan')
      .upload(filePath, '', {
        contentType: 'text/plain',
        upsert: true // <-- Penting: untuk overwrite file yang sudah ada
      })

    if (error) {
      throw error
    }

    return NextResponse.json({ message: 'Pesan ditandai sebagai dibaca' }, { status: 200 })

  } catch (error) {
    console.error('Mark as read error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui status pesan' }, { status: 500 })
  }
}