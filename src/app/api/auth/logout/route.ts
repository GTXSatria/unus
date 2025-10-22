// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// --- TAMBAHKAN KONSTANTA INI UNTUK KONSISTENSI ---
const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
}

export async function POST() {
  const cookieStore = await cookies()
  
  // --- KOREKSI: Gunakan sameSite: 'strict' untuk konsistensi ---
  cookieStore.set('guruToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // <--- Diubah dari 'lax' menjadi 'strict'
    maxAge: -1,
    path: '/'
  })

  cookieStore.set('siswaToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // <--- Diubah dari 'lax' menjadi 'strict'
    maxAge: -1,
    path: '/'
  })

  // --- KOREKSI: Tambahkan header anti-cache ---
  return NextResponse.json({ message: 'Logout berhasil' }, { headers: noCacheHeaders })
}