// src/app/api/admin/pesan/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

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

    // Ambil data lengkap dari DB untuk cek role
    const guru = await db.guru.findUnique({
      where: { id: decoded.id },
      select: { role: true }
    });

    if (guru?.role !== 'ADMIN') return null
    
    return decoded
  } catch {
    return null
  }
}

// --- GET: Admin mengambil semua pesan (saran & pengumuman) ---
export async function GET(request: NextRequest) {
  const admin = await verifyAdminToken(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Ambil semua saran dari guru
    const { data: saranFolders, error: saranError } = await supabase.storage
      .from('pesan')
      .list('sarankritik', { limit: 100 })

    if (saranError) throw saranError;

    const saranList = await Promise.all(
      (saranFolders || []).map(async (folder) => {
        const { data: files } = await supabase.storage
          .from('pesan')
          .list(`sarankritik/${folder.name}`, { limit: 100 })
        
        const guru = await db.guru.findUnique({ where: { id: folder.name }, select: { name: true, email: true } });

        const messages = await Promise.all(
          (files || []).map(async (file) => {
            const { data: fileData } = await supabase.storage
              .from('pesan')
              .download(`sarankritik/${folder.name}/${file.name}`)
            const content = await fileData?.text();

            return {
              id: `sarankritik/${folder.name}/${file.name}`,
              dari: guru?.name || 'Guru Tidak Dikenal',
              email: guru?.email,
              judul: 'Saran & Kritik',
              isi: content || '',
              createdAt: file.created_at
            }
          })
        );
        return messages;
      })
    );

    // 2. Ambil semua pengumuman yang pernah dikirim
    const { data: publicAnnouncements, error: publicError } = await supabase.storage
      .from('pesan')
      .list('pengumuman/semua', { limit: 100 })
    
    const publicList = await Promise.all(
      (publicAnnouncements || []).map(async (file) => {
        const { data: fileData } = await supabase.storage
          .from('pesan')
          .download(`pengumuman/semua/${file.name}`)
        const content = await fileData?.text();

        return {
          id: `pengumuman/semua/${file.name}`,
          dari: 'Admin',
          judul: 'Pengumuman (Umum)',
          isi: content || '',
          createdAt: file.created_at
        }
      })
    );

    const allPesan = [...saranList.flat(), ...publicList].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(allPesan);

  } catch (error) {
    console.error('Get admin pesan error:', error)
    return NextResponse.json({ error: 'Gagal mengambil pesan' }, { status: 500 })
  }
}

// --- POST: Admin mengirim pengumuman ---
export async function POST(request: NextRequest) {
  const admin = await verifyAdminToken(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { isi, penerima } = await request.json()
    if (!isi || !penerima) {
      return NextResponse.json({ error: 'Isi pesan dan penerima harus diisi' }, { status: 400 })
    }

    const fileName = `${Date.now()}.txt`
    let filePath = ''

    if (penerima === 'all') {
      filePath = `pengumuman/semua/${fileName}`
    } else {
      filePath = `pengumuman/personal/${penerima}/${fileName}`
    }

    const { error } = await supabase.storage
      .from('pesan')
      .upload(filePath, isi, {
        contentType: 'text/plain',
        upsert: false
      })

    if (error) throw error

    return NextResponse.json({ message: 'Pengumuman berhasil dikirim' }, { status: 201 })

  } catch (error) {
    console.error('Post admin pesan error:', error)
    return NextResponse.json({ error: 'Gagal mengirim pengumuman' }, { status: 500 })
  }
}