import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json()

    if (!email || !password || !role) {
      return NextResponse.json(
        { message: 'Semua field harus diisi' },
        { status: 400 }
      )
    }

    if (role !== 'guru') {
      return NextResponse.json(
        { message: 'Role tidak valid' },
        { status: 400 }
      )
    }

    // Cari guru berdasarkan email
    const guru = await db.guru.findUnique({
      where: { email }
    })

    if (!guru) {
      return NextResponse.json(
        { message: 'Email atau password salah' },
        { status: 401 }
      )
    }

    // Verifikasi password
    const isValidPassword = await bcrypt.compare(password, guru.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Email atau password salah' },
        { status: 401 }
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
      { expiresIn: '24h' }
    )

    return NextResponse.json({
      message: 'Login berhasil',
      token,
      user: {
        id: guru.id,
        name: guru.name,
        email: guru.email
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}