// src/app/api/pesan/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

// --- Konfigurasi Supabase ---
const SUPABASE_URL = process.env.NEXT_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Supabase environment variables missing')
}

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

// --- GET: Guru mengambil daftar pesan masuk ---
export async function GET(request: NextRequest) {
  const guru = await verifyGuruToken(request)
  if (!guru) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const guruId = guru.id

    // 1. Ambil daftar file dari folder pengumuman untuk semua
    const { data: publicFiles, error: publicError } = await supabase.storage
      .from('pesan')
      .list('pengumuman/semua', { limit: 100 })

    // 2. Ambil daftar file dari folder pengumuman personal
    const { data: personalFiles, error: personalError } = await supabase.storage
      .from('pesan')
      .list(`pengumuman/personal/${guruId}`, { limit: 100 })

    if (publicError || personalError) {
      throw new Error('Gagal mengambil daftar pesan')
    }

    const allFiles = [
      ...(publicFiles || []).map(f => ({ ...f, type: 'public' })),
      ...(personalFiles || []).map(f => ({ ...f, type: 'personal' }))
    ]

    // 3. Download isi setiap file
    const pesanList = await Promise.all(
      allFiles.map(async (file) => {
        const filePath = file.type === 'public' 
          ? `pengumuman/semua/${file.name}` 
          : `pengumuman/personal/${guruId}/${file.name}`
        
        const { data: fileData } = await supabase.storage
          .from('pesan')
          .download(filePath)

        const content = await fileData?.text()
        
        return {
          id: filePath, // Gunakan path sebagai ID unik
          dari: 'Admin',
          judul: `Pengumuman ${file.type === 'personal' ? '(Personal)' : '(Umum)'}`,
          isi: content || '',
          createdAt: file.created_at
        }
      })
    )

    // Urutkan dari yang terbaru
    pesanList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // --- Hitung pesan yang belum dibaca (Versi Diperbaiki) ---
    // --- Hitung pesan yang belum dibaca (Versi Kompatibel) ---
    let unreadCount = 0;
    try {
      // Gunakan list() untuk mencari file read-status
      const { data: files, error } = await supabase.storage
        .from('pesan')
        .list('read-status', { 
          search: `${guruId}.txt`, // Cari file spesifik ini
          limit: 1 
        });
      
      if (error || !files || files.length === 0) {
        // Jika error atau file tidak ditemukan, anggap semua pesan belum dibaca
        unreadCount = pesanList.length;
      } else {
        // Jika file ditemukan, ambil waktu pembuatannya
        const lastReadTime = new Date(files[0].created_at).getTime();
        unreadCount = pesanList.filter(p => new Date(p.createdAt).getTime() > lastReadTime).length;
      }
    } catch (error) {
      // Fallback jika terjadi error tak terduga
      console.error('Error checking read status:', error);
      unreadCount = pesanList.length;
    }

    return NextResponse.json({ messages: pesanList, unreadCount });

  } catch (error) {
    console.error('Get pesan error:', error)
    return NextResponse.json({ error: 'Gagal mengambil pesan' }, { status: 500 })
  }
}

// --- POST: Guru mengirim saran & kritik ---
export async function POST(request: NextRequest) {
  const guru = await verifyGuruToken(request)
  if (!guru) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { isi } = await request.json()
    if (!isi) {
      return NextResponse.json({ error: 'Isi pesan tidak boleh kosong' }, { status: 400 })
    }

    const guruId = guru.id
    const fileName = `${Date.now()}.txt`
    const filePath = `sarankritik/${guruId}/${fileName}`

    // Upload file teks ke Supabase Storage
    const { error } = await supabase.storage
      .from('pesan')
      .upload(filePath, isi, {
        contentType: 'text/plain',
        upsert: false
      })

    if (error) {
      throw error
    }

    return NextResponse.json({ message: 'Saran berhasil dikirim' }, { status: 201 })

  } catch (error) {
    console.error('Post pesan error:', error)
    return NextResponse.json({ error: 'Gagal mengirim pesan' }, { status: 500 })
  }
}