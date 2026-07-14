// src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

// YANG BARU DAN KONSISTEN
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
// --- TAMBAHKAN KONSTANTA INI UNTUK MENJAGA KODE RAPI ---
const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
}
export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json()
    if (!email || !password || !role) {
      return NextResponse.json(
        { message: 'Semua field harus diisi' },
        { status: 400, headers: noCacheHeaders }
      )
    }
    if (role !== 'guru') {
      return NextResponse.json(
        { message: 'Role tidak valid' },
        { status: 401, headers: noCacheHeaders }
      )
    }

    // Cari guru berdasarkan email
    const guru = await db.guru.findUnique({
      where: { email }
    })
    if (!guru) {
      return NextResponse.json(
        { message: 'Email atau password salah' },
        { status: 401, headers: noCacheHeaders }
      )
    }
    // Verifikasi password
    const isValidPassword = await bcrypt.compare(password, guru.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Email atau password salah' },
        { status: 401, headers: noCacheHeaders }
      )
    }
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: guru.id, 
        email: guru.email, 
        role: 'guru' 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    const response = NextResponse.json({
      message: 'Login berhasil',
      user: {
        id: guru.id,
        name: guru.name,
        email: guru.email
      }
    }, {
      // --- KOREKSI BARIS 72 ---
      headers: noCacheHeaders
    });
    response.cookies.set({
      name: 'guruToken', // Nama cookie
      value: token,      // Nilai token
      httpOnly: true,    // Penting: Tidak bisa diakses via JavaScript
      secure: process.env.NODE_ENV === 'production', // Hanya kirim via HTTPS
      sameSite: 'strict', // Perlindungan dari CSRF
      maxAge: 60 * 60 * 24, // Umur cookie: 1 hari
      path: '/',          // Cookie berlaku untuk seluruh situs
    });
    return response;
  } catch (error) {
    // console.error aman digunakan untuk logging error di server
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500, headers: noCacheHeaders }
    )
  }
}