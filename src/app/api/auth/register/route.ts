import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
// YANG BARU DAN KONSISTEN
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    // console.log('=== REGISTER API CALLED ===') // Di-comment
    
    const { name, email, password, role } = await request.json()
    
    // console.log('Request data:', { name, email, role })
    // console.log('DATABASE_URL:', process.env.DATABASE_URL)
    
    if (!name || !email || !password || !role) {
      // console.log('Validation error: Missing fields')
      return NextResponse.json(
        { message: 'Semua field harus diisi' },
        { status: 400 }
      )
    }

    if (role !== 'guru') {
      console.log('Validation error: Invalid role')
      return NextResponse.json(
        { message: 'Role tidak valid' },
        { status: 400 }
      )
    }

    // console.log('Checking if email already exists...')
    
    // Cek apakah email sudah terdaftar
    const existingGuru = await db.guru.findUnique({
      where: { email }
    })

    // console.log('Existing guru:', existingGuru)

    if (existingGuru) {
      // console.log('Email already registered')
      return NextResponse.json(
        { message: 'Email sudah terdaftar' },
        { status: 400 }
      )
    }

    // console.log('Hashing password...')
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // console.log('Creating new guru...')

    // Buat guru baru
    const guru = await db.guru.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    })

    // console.log('Guru created:', guru)
    console.log('New guru registered successfully.'); // Log aman

    return NextResponse.json({
      message: 'Registrasi berhasil',
      user: {
        id: guru.id,
        name: guru.name,
        email: guru.email
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
    return NextResponse.json(
      { message: 'Terjadi kesalahan server: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}