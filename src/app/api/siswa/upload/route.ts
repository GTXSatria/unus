import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import * as XLSX from 'xlsx'
// YANG BARU DAN KONSISTEN
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function verifyGuruToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    if (decoded.role !== 'guru') {
      return null
    }
    return decoded
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // console.log('Upload siswa API called')
    
    const guru = verifyGuruToken(request)
    if (!guru) {
      // console.log('Unauthorized access attempt')
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      // console.log('No file provided')
      return NextResponse.json(
        { message: 'File harus diupload' },
        { status: 400 }
      )
    }

    // console.log('Processing file:', file.name, file.type, file.size)

    // Proses file Excel/CSV
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Fix: Tentukan tipe array secara eksplisit
    let jsonData: Array<{[key: string]: string}> = []
    
    try {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        // Handle CSV files
        const text = buffer.toString('utf-8')
        const lines = text.split('\n').filter(line => line.trim())
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        
        // Fix: Tentukan tipe array secara eksplisit
        const data: Array<{[key: string]: string}> = []
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
          const row: {[key: string]: string} = {}
          headers.forEach((header, index) => {
            row[header] = values[index] || ''
          })
          data.push(row)
        }
        
        jsonData = data
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 file.type === 'application/vnd.ms-excel' ||
                 file.name.endsWith('.xlsx') ||
                 file.name.endsWith('.xls')) {
        // Handle Excel files
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const tempData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        // Convert array of arrays to array of objects using first row as headers
        if (tempData.length > 0) {
          const headers = tempData[0] as string[]
          const data: Array<{[key: string]: string}> = []
          
          for (let i = 1; i < tempData.length; i++) {
            const row = tempData[i] as any[]
            if (row.some(cell => cell !== undefined && cell !== null && cell !== '')) {
              const obj: {[key: string]: string} = {}
              headers.forEach((header, index) => {
                obj[header] = row[index] || ''
              })
              data.push(obj)
            }
          }
          jsonData = data
        }
      } else {
        return NextResponse.json(
          { message: 'Format file tidak didukung. Gunakan file CSV atau Excel (.xls, .xlsx)' },
          { status: 400 }
        )
      }
    } catch (parseError) {
      console.error('Error parsing file:', parseError)
      return NextResponse.json(
        { message: 'Gagal membaca file. Pastikan format file Excel (.xls, .xlsx) atau CSV benar.' },
        { status: 400 }
      )
    }

    // console.log('Parsed data:', jsonData.length, 'rows')

    // Validasi dan proses data siswa
    // Fix: Tentukan tipe array secara eksplisit
    const siswaData: Array<{nisn: string, nama: string, kelas: string, guruId: any}> = []
    const errors: string[] = []

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]
      const nisn = String(row.NISN || row.nisn || '').trim()
      const nama = String(row.NAMA || row.nama || '').trim()
      const kelas = String(row.KELAS || row.kelas || '').trim()

      if (!nisn || !nama || !kelas) {
        errors.push(`Baris ${i + 2}: Data tidak lengkap (NISN: "${nisn}", Nama: "${nama}", Kelas: "${kelas}")`)
        continue
      }

      // Cek apakah NISN sudah ada untuk guru ini
      try {
        const existingSiswa = await db.siswa.findUnique({
          where: { 
            nisn_guruId: {
              nisn: nisn,
              guruId: guru.id
            }
          }
        })

        if (existingSiswa) {
          errors.push(`Baris ${i + 2}: NISN ${nisn} sudah terdaftar`)
          continue
        }

        siswaData.push({
          nisn,
          nama,
          kelas,
          guruId: guru.id
        })
      } catch (dbError) {
        console.error('Database error checking NISN:', dbError)
        errors.push(`Baris ${i + 2}: Error checking NISN ${nisn}`)
      }
    }

    // console.log('Processed data:', siswaData.length, 'valid students')
    console.log('Errors:', errors.length)

    if (errors.length > 0 && siswaData.length === 0) {
      return NextResponse.json({
        message: 'Tidak ada data yang valid untuk diupload',
        errors
      }, { status: 400 })
    }

    // Simpan data siswa ke database
    try {
      let createdCount = 0
      
      for (const siswa of siswaData) {
        try {
          await db.siswa.create({
            data: siswa
          })
          createdCount++
        } catch (error: any) {
          // Skip duplicate entries
          if (error.code === 'P2002') {
            // console.log(`Skipping duplicate NISN for guru: ${siswa.nisn}`)
            continue
          }
          throw error
        }
      }

      // console.log('Created students:', createdCount)

      return NextResponse.json({
        message: `Berhasil mengupload ${createdCount} siswa`,
        total: siswaData.length,
        created: createdCount,
        errors: errors.length > 0 ? errors : undefined
      })
    } catch (dbError) {
      console.error('Database error creating students:', dbError)
      return NextResponse.json(
        { message: 'Gagal menyimpan data ke database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Upload siswa error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}