'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Upload, 
  Download, 
  FileText,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react'

interface Ujian {
  id: string
  kodeUjian: string
  namaUjian: string
  kelas: string
  jumlahSoal: number
  lamaUjian: number
  tipePilihan: string
}

export default function UploadKunciJawaban() {
  const [ujians, setUjians] = useState<Ujian[]>([])
  const [selectedUjian, setSelectedUjian] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check authentication using cookies
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          router.push('/login/guru');
          return;
        }
        const userData = await response.json();
        // User is authenticated, proceed
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login/guru');
        return;
      }
    };

    checkAuth();
    fetchUjians();
  }, [router])

  const fetchUjians = async () => {
    try {
      const response = await fetch('/api/ujian', {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUjians(data)
      } else {
        console.error('Failed to fetch ujians')
      }
    } catch (error) {
      console.error('Error fetching ujians:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setMessage('')
    }
  }

  const handleUpload = async () => {
    if (!selectedUjian || !file) {
      setMessage('Silakan pilih ujian dan file kunci jawaban')
      setMessageType('error')
      return
    }

    setIsUploading(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/ujian/${selectedUjian}/kunci-jawaban/upload`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        setMessage(result.message)
        setMessageType('success')
        setFile(null)
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        setMessage(result.message)
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error uploading kunci jawaban:', error)
      setMessage('Terjadi kesalahan saat mengupload kunci jawaban')
      setMessageType('error')
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplate = () => {
    if (!selectedUjian) {
      setMessage('Silakan pilih ujian terlebih dahulu')
      setMessageType('error')
      return
    }

    const ujian = ujians.find(u => u.id === selectedUjian)
    if (!ujian) return

    // Generate template based on exam type
    let template = 'Nomor,Jawaban\n'
    const choices = ujian.tipePilihan.split('')
    
    for (let i = 1; i <= ujian.jumlahSoal; i++) {
      template += `${i},${choices[0]}\n`
    }

    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `template_kunci_${ujian.kodeUjian}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link
                href="/dashboard/guru"
                className="mr-4 text-gray-600 hover:text-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Upload Kunci Jawaban</h1>
                <p className="text-sm text-gray-500">Upload kunci jawaban untuk ujian</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Upload File Kunci Jawaban</h2>
            
            {/* Select Ujian */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Ujian
              </label>
              <select
                value={selectedUjian}
                onChange={(e) => setSelectedUjian(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Pilih Ujian --</option>
                {ujians.map((ujian) => (
                  <option key={ujian.id} value={ujian.id}>
                    {ujian.kodeUjian} - {ujian.namaUjian} ({ujian.kelas})
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Kunci Jawaban (CSV)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  id="file-input"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="file-input"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    {file ? file.name : 'Klik untuk memilih file CSV'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    Format: Nomor,Jawaban (contoh: 1,A)
                  </span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleUpload}
                disabled={!selectedUjian || !file || isUploading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Mengupload...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Kunci Jawaban
                  </>
                )}
              </button>
              <button
                onClick={downloadTemplate}
                disabled={!selectedUjian}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Template
              </button>
            </div>

            {/* Message */}
            {message && (
              <div className={`mt-4 p-4 rounded-lg flex items-center ${
                messageType === 'success' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {messageType === 'success' ? (
                  <CheckCircle className="w-5 h-5 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2" />
                )}
                {message}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Petunjuk Upload</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">1. Format File CSV</h3>
                <p className="text-sm text-gray-600 mb-2">
                  File harus dalam format CSV dengan dua kolom:
                </p>
                <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                  Nomor,Jawaban<br />
                  1,A<br />
                  2,B<br />
                  3,C<br />
                  ...
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">2. Panduan Jawaban</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Gunakan huruf kapital (A, B, C, D, E)</li>
                  <li>• Nomor soal harus berurutan dari 1</li>
                  <li>• Jumlah jawaban harus sesuai dengan jumlah soal</li>
                  <li>• Tidak ada baris kosong di antara data</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">3. Download Template</h3>
                <p className="text-sm text-gray-600">
                  Setelah memilih ujian, klik tombol "Template" untuk mendownload file CSV yang sudah diformat sesuai dengan ujian yang dipilih.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">💡 Tips</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Periksa kembali file sebelum upload</li>
                  <li>• Pastikan semua soal memiliki kunci jawaban</li>
                  <li>• Simpan file CSV dengan encoding UTF-8</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Daftar Ujian */}
        <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Daftar Ujian</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kode Ujian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Ujian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kelas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah Soal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipe Pilihan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ujians.map((ujian) => (
                  <tr key={ujian.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {ujian.kodeUjian}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ujian.namaUjian}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ujian.kelas}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ujian.jumlahSoal}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ujian.tipePilihan}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ujians.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada ujian yang tersedia</p>
                <Link
                  href="/dashboard/guru/upload-ujian"
                  className="mt-4 text-blue-600 hover:text-blue-700 inline-block"
                >
                  Upload Ujian Baru
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}