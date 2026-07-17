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
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          router.push('/login/guru');
          return;
        }
        const userData = await response.json();
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
        fetchUjian()
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

  // Helper: parse jawaban dari CSV line — support "A" dan "A-C-E"
  function parseJawabanCSV(raw: string): string[] {
    const cleaned = raw.replace(/"/g, '').trim().toUpperCase()
    if (!cleaned) return []
    if (cleaned.includes('-')) {
      return cleaned.split('-').map(s => s.trim()).filter(Boolean)
    }
    if (cleaned.includes(',')) {
      return cleaned.split(',').map(s => s.trim()).filter(Boolean)
    }
    return [cleaned]
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())

      const newKunci: KunciJawaban = {}

      // Skip header row (index 0)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // Split hanya di koma pertama
        const idx = line.indexOf(',')
        if (idx === -1) continue

        const nomorStr = line.substring(0, idx).trim()
        const jawabanRaw = line.substring(idx + 1).trim()

        if (nomorStr && jawabanRaw) {
          const letters = parseJawabanCSV(jawabanRaw)
          if (letters.length > 0) {
            // Simpan sebagai koma-separated, sorted
            newKunci[parseInt(nomorStr)] = [...letters].sort().join(',')
          }
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
    const template = 'Nomor,Jawaban\n1,A\n2,B\n3,A-C-E\n4,D\n5,A-D'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_kunci_jawaban.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // === BARU: Toggle jawaban (checkbox behavior) ===
  const handleKunciChange = (nomor: number, value: string) => {
    setKunciJawaban(prev => {
      const current = prev[nomor] || ''
      const currentLetters = current ? current.split(',').filter(Boolean) : []

      if (currentLetters.includes(value)) {
        // Deselect — hapus value
        const filtered = currentLetters.filter(l => l !== value)
        const updated = { ...prev }
        if (filtered.length === 0) {
          delete updated[nomor]
        } else {
          updated[nomor] = filtered.sort().join(',')
        }
        return updated
      } else {
        // Select — tambah value
        return {
          ...prev,
          [nomor]: [...currentLetters, value].sort().join(',')
        }
      }
    })
  }

  // Helper: cek apakah pilihan terpilih untuk soal tertentu
  const isSelected = (nomor: number, pilihan: string): boolean => {
    const current = kunciJawaban[nomor] || ''
    return current.split(',').includes(pilihan)
  }

  // Helper: dapatkan opsi pilihan dari tipePilihan
  const getPilihanOptions = (): string[] => {
    if (!ujian) return []
    return ujian.tipePilihan.split('')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page-gradient flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-header mx-auto"></div>
          <p className="mt-4 text-brand-on-dark">Memuat data...</p>
        </div>
      </div>
    )
  }

  if (!ujian) {
    return (
      <div className="min-h-screen bg-page-gradient flex items-center justify-center">
        <div className="text-center">
          <p className="text-brand-on-dark">Ujian tidak ditemukan</p>
          <Link
            href="/dashboard/guru"
            className="mt-4 text-brand-link hover:text-brand-link-hover"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-page-gradient">
      {/* Header */}
      <header className="bg-brand-header shadow-sm border-b border-brand-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link
                href="/dashboard/guru"
                className="mr-4 text-brand-header hover:opacity-80"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-brand-header">Kunci Jawaban</h1>
                <p className="text-sm text-brand-on-dark">{ujian.kodeUjian} - {ujian.namaUjian}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-brand px-4 py-2 rounded-lg flex items-center"
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
                    className="bg-brand-surface-hover text-brand-heading px-4 py-2 rounded-lg hover:opacity-80 flex items-center"
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
          <div className="bg-page-gradient-hover rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-brand-on-dark mb-4">Upload Kunci Jawaban</h3>
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
                className="btn-brand px-4 py-2 rounded-lg flex items-center"
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
            <p className="mt-2 text-sm text-brand-on-dark opacity-70">
              Format CSV: nomor_soal,jawaban — Single: <span className="font-mono font-semibold">1,A</span> | Ganda: <span className="font-mono font-semibold">3,A-C-E</span> (pisah dengan dash)
            </p>
          </div>
        )}

        {/* Kunci Jawaban Table */}
        <div className="bg-page-gradient-hover rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-brand-table-header border-b border-brand-surface">
            <h3 className="text-lg font-semibold text-brand-header">
              Daftar Kunci Jawaban ({ujian.jumlahSoal} Soal)
            </h3>
            <p className="text-sm text-brand-on-dark mt-1 opacity-70">
              Kelas: {ujian.kelas} | Tipe Pilihan: {ujian.tipePilihan}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-surface">
              <thead className="bg-brand-table-header">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-header uppercase tracking-wider">
                    Nomor Soal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-header uppercase tracking-wider">
                    Kunci Jawaban
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-header uppercase tracking-wider">
                    Tipe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-header uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-brand-surface">
                {Array.from({ length: ujian.jumlahSoal }, (_, i) => i + 1).map((nomor) => {
                  const jawaban = kunciJawaban[nomor]
                  const isMultiple = jawaban && jawaban.includes(',')
                  return (
                    <tr key={nomor}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-heading">
                        {nomor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {isEditing ? (
                          /* === CHECKBOX GROUP (bukan select) === */
                          <div className="flex gap-1.5">
                            {getPilihanOptions().map(pilihan => (
                              <button
                                key={pilihan}
                                type="button"
                                onClick={() => handleKunciChange(nomor, pilihan)}
                                className={`px-3 py-1.5 rounded text-sm font-semibold border-2 transition-colors ${
                                  isSelected(nomor, pilihan)
                                    ? 'bg-green-600 text-white border-green-600'
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {pilihan}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            jawaban
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {jawaban || 'Belum Ada'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {!isEditing && jawaban && (
                          isMultiple ? (
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                              Ganda
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600">
                              Tunggal
                            </span>
                          )
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
        <div className="mt-6 bg-page-gradient-hover rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-brand-on-dark mb-4">Ringkasan</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/20 p-4 rounded-lg">
              <p className="text-sm text-brand-on-dark opacity-80 font-medium">Total Soal</p>
              <p className="text-2xl font-bold text-brand-on-dark">{ujian.jumlahSoal}</p>
            </div>
            <div className="bg-white/20 p-4 rounded-lg">
              <p className="text-sm text-green-400 font-medium">Sudah Ada Kunci</p>
              <p className="text-2xl font-bold text-green-300">{Object.keys(kunciJawaban).length}</p>
            </div>
            <div className="bg-white/20 p-4 rounded-lg">
              <p className="text-sm text-red-400 font-medium">Belum Ada Kunci</p>
              <p className="text-2xl font-bold text-red-300">{ujian.jumlahSoal - Object.keys(kunciJawaban).length}</p>
            </div>
          </div>

          {/* Info soal ganda */}
          {Object.keys(kunciJawaban).length > 0 && (
            <div className="mt-4 p-4 bg-white/10 rounded-lg">
              <p className="text-sm text-brand-on-dark opacity-80">
                <span className="font-semibold">Soal jawaban ganda:</span>{' '}
                {Object.entries(kunciJawaban)
                  .filter(([, v]) => v.includes(','))
                  .map(([k, v]) => `No.${k} (${v})`)
                  .join(', ') || 'Tidak ada'}
              </p>
            </div>
          )}

          {Object.keys(kunciJawaban).length === ujian.jumlahSoal && (
            <div className="mt-4 p-4 bg-green-500/20 border border-green-400/50 text-green-300 rounded-lg">
              <p className="font-medium">✅ Lengkap!</p>
              <p className="text-sm opacity-80">Semua soal sudah memiliki kunci jawaban.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}