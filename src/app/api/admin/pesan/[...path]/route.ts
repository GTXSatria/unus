// src/app/api/admin/pesan/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

// --- Konfigurasi Supabase ---
const SUPABASE_URL = process.env.NEXT_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// --- Helper Verifikasi Token Admin ---
async function verifyAdminToken(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('guruToken')?.value

  if (!token) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    if (decoded.role !== 'guru') return null
    
    // Di sini kita asumsikan pengecekan role sudah dilakukan di helper
    // Untuk kemudahan, kita anggap yang mencapai sini sudah lolos
    return decoded
  } catch {
    return null
  }
}

// --- DELETE: Admin menghapus pesan apa pun ---
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const admin = await verifyAdminToken(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { path } = await params
    const filePath = path.join('/')

    const { error } = await supabase.storage
      .from('pesan')
      .remove([filePath])

    if (error) {
      throw error
    }

    return NextResponse.json({ message: 'Pesan berhasil dihapus' })

  } catch (error) {
    console.error('Delete admin pesan error:', error)
    return NextResponse.json({ error: 'Gagal menghapus pesan' }, { status: 500 })
  }
}