'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Upload, FileText, ArrowLeft, Save } from 'lucide-react'

export default function UploadUjian() {
  const [formData, setFormData] = useState({
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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const kunciInputRef = useRef<HTMLInputElement>(null)

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

    if (!pdfFile) {
      setError('File PDF soal harus diupload')
      setIsLoading(false)
      return
    }

    if (!kunciFile) {
      setError('File kunci jawaban harus diupload')
      setIsLoading(false)
      return
    }

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('kodeUjian', formData.kodeUjian)
      formDataToSend.append('namaUjian', formData.namaUjian)
      formDataToSend.append('kelas', formData.kelas)
      formDataToSend.append('jumlahSoal', formData.jumlahSoal)
      formDataToSend.append('lamaUjian', formData.lamaUjian)
      formDataToSend.append('tipePilihan', formData.tipePilihan)
      formDataToSend.append('pdfFile', pdfFile)
      formDataToSend.append('kunciFile', kunciFile)

      
      const response = await fetch('/api/ujian/upload', {
        method: 'POST',
        body: formDataToSend
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Ujian berhasil diupload!')
        setTimeout(() => {
          router.push('/dashboard/guru')
        }, 2000)
      } else {
        setError(data.message || 'Upload gagal')
      }
    } catch (error) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  // ⬇️ Tambahkan fungsi sederhana ini (SETELAH handleKunciChange)
const downloadKunciTemplate = () => {
  const templateContent = [
    ['Nomor', 'Jawaban'],
    ['1', 'A'],
    ['2', 'B'],
    ['3', 'C']
  ];

  const csvContent = templateContent.map(row => row.join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'template_kunci_jawaban.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};


  return (
    <div className="min-h-screen bg-page-gradient">
      {/* Header */}
      <header className="bg-brand-header shadow-sm border-b border-brand-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-10 gap-3">
            <Link
              href="/dashboard/guru"
              className="bg-page-gradient-hover text-brand-header px-3 py-2 rounded-lg flex items-center hover:opacity-80"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Kembali
            </Link>
            <h1 className="text-xl font-bold text-brand-header">Upload Ujian Baru</h1>
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
                    placeholder="Contoh: XII-A/X-2/X-II/X-IPA1/7-i"
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

            {/* Upload PDF */}
            <div>
              <h2 className="text-lg font-semibold text-brand-on-dark mb-4">Upload Soal PDF</h2>
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
                    <FileText className="w-8 h-8 text-brand-on-dark mr-3" />
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
                    <p className="text-brand-on-dark mb-2">Klik untuk upload file PDF soal ujian</p>
                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      className="btn-brand px-4 py-2 rounded-lg flex items-center mx-auto"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Pilih File PDF
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Kunci Jawaban */}
            <div>
              <h2 className="text-lg font-semibold text-brand-on-dark mb-4">Upload Kunci Jawaban</h2>
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
                    <p className="text-brand-on-dark mb-2">Klik untuk upload file Excel kunci jawaban</p>
                    <button
                      type="button"
                      onClick={() => kunciInputRef.current?.click()}
                      className="btn-brand px-4 py-2 rounded-lg flex items-center mx-auto"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Pilih File Excel
                    </button>
                    <button
                    type="button"
                    onClick={downloadKunciTemplate}
                    className="btn-brand px-4 py-2 rounded-lg flex items-center mx-auto mt-2"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Download Template Kunci (Contoh 3 Soal)
                  </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-brand-on-dark mt-2">
                template berupa File CVS anda bisa merubah format CVS ke xls atau xlsx (blok kolom A klik data-Teks to Columns pilih Tab dan Desimal)
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
                {isLoading ? 'Mengupload...' : 'Simpan Ujian'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}