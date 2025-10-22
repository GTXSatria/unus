'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Upload,
  Download,
  Edit,
  Check,
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
  kunciJawaban?: string
}

interface KunciJawaban {
  [key: number]: string
}

export default function KunciJawabanDetail() {
  const [ujian, setUjian] = useState<Ujian | null>(null)
  const [kunciJawaban, setKunciJawaban] = useState<KunciJawaban>({})
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')
  const router = useRouter()
  const params = useParams()

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
    fetchUjian();
  }, [router, params.id])

  const fetchUjian = async () => {
    try {
      const response = await fetch(`/api/ujian/${params.id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUjian(data)
        
        // Parse kunci jawaban jika ada
        if (data.kunciJawaban) {
          try {
            const parsed = JSON.parse(data.kunciJawaban)
            setKunciJawaban(parsed)
          } catch {
            setKunciJawaban({})
          }
        }
      } else {
        console.error('Failed to fetch ujian')
      }
    } catch (error) {
      console.error('Error fetching ujian:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/ujian/${params.id}/kunci-jawaban`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ kunciJawaban })
      })

      if (response.ok) {
        setIsEditing(false)
        fetchUjian() // Refresh data
        alert('Kunci jawaban berhasil disimpan!')
      } else {
        alert('Gagal menyimpan kunci jawaban')
      }
    } catch (error) {
      console.error('Error saving kunci jawaban:', error)
      alert('Terjadi kesalahan saat menyimpan')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus semua kunci jawaban?')) return

    try {
      const response = await fetch(`/api/ujian/${params.id}/kunci-jawaban`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setKunciJawaban({})
        setIsEditing(false)
        alert('Kunci jawaban berhasil dihapus!')
      } else {
        alert('Gagal menghapus kunci jawaban')
      }
    } catch (error) {
      console.error('Error deleting kunci jawaban:', error)
      alert('Terjadi kesalahan saat menghapus')
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      const newKunci: KunciJawaban = {}
      
      for (let i = 0; i < lines.length; i++) {
        const [nomor, jawaban] = lines[i].split(',').map(s => s.trim())
        if (nomor && jawaban) {
          newKunci[parseInt(nomor)] = jawaban
        }
      }

      setKunciJawaban(newKunci)
      setUploadMessage(`Berhasil mengupload ${Object.keys(newKunci).length} kunci jawaban`)
      setTimeout(() => setUploadMessage(''), 3000)
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Gagal membaca file. Pastikan format CSV benar (nomor,jawaban)')
    }
  }

  const downloadTemplate = () => {
    const template = '1,A\n2,B\n3,C\n4,D\n5,A'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_kunci_jawaban.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleKunciChange = (nomor: number, value: string) => {
    setKunciJawaban(prev => ({
      ...prev,
      [nomor]: value
    }))
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

  if (!ujian) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Ujian tidak ditemukan</p>
          <Link
            href="/dashboard/guru"
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Kembali ke Dashboard
          </Link>
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
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-gray-900">Kunci Jawaban</h1>
                <p className="text-sm text-gray-500">{ujian.kodeUjian} - {ujian.namaUjian}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </button>
                  {Object.keys(kunciJawaban).length > 0 && (
                    <button
                      onClick={handleDelete}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Hapus
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        {isEditing && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Kunci Jawaban</h3>
            <div className="flex items-center space-x-4">
              <label className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Upload CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={downloadTemplate}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </button>
            </div>
            {uploadMessage && (
              <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg">
                {uploadMessage}
              </div>
            )}
            <p className="mt-2 text-sm text-gray-500">
              Format CSV: nomor_soal,jawaban (contoh: 1,A)
            </p>
          </div>
        )}

        {/* Kunci Jawaban Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Daftar Kunci Jawaban ({ujian.jumlahSoal} Soal)
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Kelas: {ujian.kelas} | Tipe Pilihan: {ujian.tipePilihan}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nomor Soal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kunci Jawaban
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.from({ length: ujian.jumlahSoal }, (_, i) => i + 1).map((nomor) => {
                  const jawaban = kunciJawaban[nomor]
                  return (
                    <tr key={nomor}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {nomor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {isEditing ? (
                          <select
                            value={jawaban || ''}
                            onChange={(e) => handleKunciChange(nomor, e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Pilih Jawaban</option>
                            {ujian.tipePilihan.includes('A') && <option value="A">A</option>}
                            {ujian.tipePilihan.includes('B') && <option value="B">B</option>}
                            {ujian.tipePilihan.includes('C') && <option value="C">C</option>}
                            {ujian.tipePilihan.includes('D') && <option value="D">D</option>}
                            {ujian.tipePilihan.includes('E') && <option value="E">E</option>}
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            jawaban 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {jawaban || 'Belum Ada'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {jawaban ? (
                          <span className="text-green-600 flex items-center">
                            <Check className="w-4 h-4 mr-1" />
                            Ada
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center">
                            <X className="w-4 h-4 mr-1" />
                            Belum Ada
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Soal</p>
              <p className="text-2xl font-bold text-blue-900">{ujian.jumlahSoal}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Sudah Ada Kunci</p>
              <p className="text-2xl font-bold text-green-900">{Object.keys(kunciJawaban).length}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Belum Ada Kunci</p>
              <p className="text-2xl font-bold text-red-900">{ujian.jumlahSoal - Object.keys(kunciJawaban).length}</p>
            </div>
          </div>
          
          {Object.keys(kunciJawaban).length === ujian.jumlahSoal && (
            <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              <p className="font-medium">✅ Lengkap!</p>
              <p className="text-sm">Semua soal sudah memiliki kunci jawaban.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}