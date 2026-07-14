'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Upload, Users, ArrowLeft, Save, Download } from 'lucide-react'

export default function UploadSiswa() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && (
      selectedFile.type === 'application/vnd.ms-excel' || 
      selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      selectedFile.type === 'text/csv' ||
      selectedFile.name.endsWith('.csv') ||
      selectedFile.name.endsWith('.xls') ||
      selectedFile.name.endsWith('.xlsx')
    )) {
      setFile(selectedFile)
    } else {
      setError('File harus berformat Excel (.xls, .xlsx) atau CSV')
    }
  }

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    if (!file) {
      setError('File Excel harus diupload')
      setIsLoading(false)
      return
    }

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('file', file)

      
      const response = await fetch('/api/siswa/upload', {
        method: 'POST',
        // --- HAPUS BLOK headers INI ---
        // headers: {
        //   'Content-Type': 'application/json'
        // },
        body: formDataToSend
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`Berhasil mengupload ${data.created} dari ${data.total} siswa`)
        setTimeout(() => {
          router.push('/dashboard/guru')
        }, 2000)
      } else {
        if (data.errors && data.errors.length > 0) {
          setError(`Error:\n${data.errors.join('\n')}`)
        } else {
          setError(data.message || 'Upload gagal')
        }
      }
    } catch (error) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadTemplate = () => {
    // Create template content
    const templateContent = [
      ['NISN', 'NAMA', 'KELAS'],
      ['1234567890', 'Ahmad Rizki', 'XII-A'],
      ['1234567891', 'Siti Nurhaliza', 'XII-A'],
      ['1234567892', 'Budi Santoso', 'XII-B']
    ]

    // Create CSV content
    const csvContent = templateContent.map(row => row.join(',')).join('\n')
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_siswa.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-300 to-blue-900">
      {/* Header */}
      <header className="bg-gradient-to-br from-blue-300 to-blue-900 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-10">
            <Link
              href="/dashboard/guru"
              className="flex items-center text-white hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Kembali
            </Link>
            <h1 className="text-xl font-bold text-white">Upload Data Siswa</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-br from-blue-300 to-blue-900 text-white px-4 py-2 rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Template Download */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Template Data Siswa</h3>
              <p className="text-gray-900 mb-4">
                Download template untuk format data siswa yang benar
              </p>
              <button
                type="button"
                onClick={downloadTemplate}
                className="bg-gradient-to-br from-blue-300 to-blue-900 hover:from-blue-900 hover:to-blue-300 hover:bg-gradient-to-br text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </button>
            </div>

            {/* Upload File */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Upload File Excel</h2>
              <div className="border-2 border-dashed border-white rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xls,.xlsx,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {file ? (
                  <div className="flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                    <span className="text-white">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="ml-3 text-white hover:text-red-700"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <div>
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-white mb-2">Klik untuk upload file Excel atau CSV data siswa</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gradient-to-br from-blue-300 to-blue-900 hover:from-blue-900 hover:to-blue-300 hover:bg-gradient-to-br text-white px-4 py-2 rounded-lg flex items-center mx-auto"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Pilih File Excel/CSV
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Format Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Format File</h3>
              <ul className="text-gray-700 space-y-1">
                <li>• Kolom A: NISN (wajib diisi, harus unik)</li>
                <li>• Kolom B: Nama Lengkap (wajib diisi)</li>
                <li>• Kolom C: Kelas (wajib diisi, contoh: XII-A)</li>
                <li>• Format file: .xls, .xlsx, atau .csv</li>
              </ul>
            </div>

            {/* Error dan Success */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="font-semibold mb-2">Error:</p>
                <pre className="whitespace-pre-wrap text-sm">{error}</pre>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/dashboard/guru"
                className="bg-gradient-to-br from-blue-300 to-blue-900 hover:from-blue-900 hover:to-blue-300 hover:bg-gradient-to-br text-white px-4 py-2 rounded-lg"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-br from-blue-300 to-blue-900 hover:from-blue-900 hover:to-blue-300 hover:bg-gradient-to-br text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Mengupload...' : 'Upload Data'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}