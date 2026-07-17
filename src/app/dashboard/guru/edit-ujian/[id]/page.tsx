'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Upload, FileText, ArrowLeft, Save } from 'lucide-react'

interface UjianData {
  id: string
  kodeUjian: string
  namaUjian: string
  kelas: string
  jumlahSoal: string
  lamaUjian: string
  tipePilihan: string
}

export default function EditUjian() {
  const [formData, setFormData] = useState<UjianData>({
    id: '',
    kodeUjian: '',
    namaUjian: '',
    kelas: '',
    jumlahSoal: '',
    lamaUjian: '',
    tipePilihan: 'ABCD'
  })
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [kunciFile, setKunciFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const params = useParams()
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const kunciInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (params.id) {
      fetchUjianData()
    }
  }, [params.id])

  const fetchUjianData = async () => {
    try {
      
      const response = await fetch(`/api/ujian/${params.id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setFormData({
          id: data.id,
          kodeUjian: data.kodeUjian,
          namaUjian: data.namaUjian,
          kelas: data.kelas,
          jumlahSoal: data.jumlahSoal.toString(),
          lamaUjian: data.lamaUjian.toString(),
          tipePilihan: data.tipePilihan
        })
      } else {
        setError('Data ujian tidak ditemukan')
        router.push('/dashboard/guru')
      }
    } catch (error) {
      setError('Terjadi kesalahan saat memuat data')
      router.push('/dashboard/guru')
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
    } else {
      setError('File harus berformat PDF')
    }
  }

  const handleKunciChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && (file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      setKunciFile(file)
    } else {
      setError('File harus berformat Excel (.xls atau .xlsx)')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('kodeUjian', formData.kodeUjian)
      formDataToSend.append('namaUjian', formData.namaUjian)
      formDataToSend.append('kelas', formData.kelas)
      formDataToSend.append('jumlahSoal', formData.jumlahSoal)
      formDataToSend.append('lamaUjian', formData.lamaUjian)
      formDataToSend.append('tipePilihan', formData.tipePilihan)
      
      if (pdfFile) {
        formDataToSend.append('pdfFile', pdfFile)
      }
      if (kunciFile) {
        formDataToSend.append('kunciFile', kunciFile)
      }

      
      const response = await fetch(`/api/ujian/${params.id}`, {
        method: 'PUT',
        // --- KOREKSI: HAPUS BARIS headers ini ---
        // headers: {
        //   'Content-Type': 'application/json'
        // },
        body: formDataToSend
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Ujian berhasil diperbarui!')
        setTimeout(() => {
          router.push('/dashboard/guru')
        }, 2000)
      } else {
        setError(data.message || 'Update gagal')
      }
    } catch (error) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-page-gradient flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-header mx-auto"></div>
          <p className="mt-4 text-brand-on-dark">Memuat data ujian...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-page-gradient">
      {/* Header */}
      <header className="bg-brand-header shadow-sm border-b border-brand-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link
              href="/dashboard/guru"
              className="flex items-center text-brand-header hover:opacity-80 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Kembali
            </Link>
            <h1 className="text-xl font-bold text-brand-header">Edit Ujian</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-page-gradient-hover rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informasi Ujian */}
            <div>
              <h2 className="text-lg font-semibold text-brand-on-dark mb-4">Informasi Ujian</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-on-dark mb-2">
                    Kode Ujian *
                  </label>
                  <input
                    type="text"
                    name="kodeUjian"
                    value={formData.kodeUjian}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-brand-surface rounded-lg focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent bg-white"
                    placeholder="Contoh: MTK001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-on-dark mb-2">
                    Nama Ujian *
                  </label>
                  <input
                    type="text"
                    name="namaUjian"
                    value={formData.namaUjian}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-brand-surface rounded-lg focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent bg-white"
                    placeholder="Contoh: Ujian Matematika Semester 1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-on-dark mb-2">
                    Kelas *
                  </label>
                  <input
                    type="text"
                    name="kelas"
                    value={formData.kelas}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-brand-surface rounded-lg focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent bg-white"
                    placeholder="Contoh: XII-A"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-on-dark mb-2">
                    Jumlah Soal *
                  </label>
                  <input
                    type="number"
                    name="jumlahSoal"
                    value={formData.jumlahSoal}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-brand-surface rounded-lg focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent bg-white"
                    placeholder="Contoh: 20"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-on-dark mb-2">
                    Lama Ujian (menit) *
                  </label>
                  <input
                    type="number"
                    name="lamaUjian"
                    value={formData.lamaUjian}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-brand-surface rounded-lg focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent bg-white"
                    placeholder="Contoh: 60"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-on-dark mb-2">
                    Tipe Pilihan *
                  </label>
                  <select
                    name="tipePilihan"
                    value={formData.tipePilihan}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-brand-surface rounded-lg focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent bg-white"
                    required
                  >
                    <option value="ABCD">A, B, C, D</option>
                    <option value="ABCDE">A, B, C, D, E</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Upload PDF (Optional) */}
            <div>
              <h2 className="text-lg font-semibold text-brand-on-dark mb-4">Update Soal PDF (Opsional)</h2>
              <div className="border-2 border-dashed border-brand-surface rounded-lg p-6 text-center">
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfChange}
                  className="hidden"
                />
                
                {pdfFile ? (
                  <div className="flex items-center justify-center">
                    <FileText className="w-8 h-8 text-brand-link mr-3" />
                    <span className="text-brand-on-dark">{pdfFile.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPdfFile(null)
                        if (pdfInputRef.current) pdfInputRef.current.value = ''
                      }}
                      className="ml-3 text-brand-on-dark hover:text-red-700"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <div>
                    <FileText className="w-12 h-12 text-brand-on-dark mx-auto mb-4" />
                    <p className="text-brand-on-dark mb-2">Klik untuk mengganti file PDF soal ujian (kosongkan jika tidak ingin mengubah)</p>
                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      className="btn-brand px-4 py-2 rounded-lg flex items-center mx-auto"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Pilih File PDF Baru
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Kunci Jawaban (Optional) */}
            <div>
              <h2 className="text-lg font-semibold text-brand-on-dark mb-4">Update Kunci Jawaban (Opsional)</h2>
              <div className="border-2 border-dashed border-brand-surface rounded-lg p-6 text-center">
                <input
                  ref={kunciInputRef}
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={handleKunciChange}
                  className="hidden"
                />
                
                {kunciFile ? (
                  <div className="flex items-center justify-center">
                    <FileText className="w-8 h-8 text-brand-on-dark mr-3" />
                    <span className="text-brand-on-dark">{kunciFile.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setKunciFile(null)
                        if (kunciInputRef.current) kunciInputRef.current.value = ''
                      }}
                      className="ml-3 text-brand-on-dark hover:text-red-700"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <div>
                    <FileText className="w-12 h-12 text-brand-on-dark mx-auto mb-4" />
                    <p className="text-brand-on-dark mb-2">Klik untuk mengganti file Excel kunci jawaban (kosongkan jika tidak ingin mengubah)</p>
                    <button
                      type="button"
                      onClick={() => kunciInputRef.current?.click()}
                      className="btn-brand px-4 py-2 rounded-lg flex items-center mx-auto"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Pilih File Excel Baru
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-brand-on-dark mt-2">
                Template: Kolom A = Nomor Soal, Kolom B = Jawaban (A/B/C/D/E)
              </p>
            </div>

            {/* Error dan Success */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
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
                className="btn-brand px-4 py-2 rounded-lg"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-brand px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}