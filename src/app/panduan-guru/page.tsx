// src/app/panduan-guru/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { FileText, Users, ArrowRight, CheckCircle, AlertCircle, Upload } from 'lucide-react'

export default function PanduanGuruPage() {
  const router = useRouter()

  const handleGoToDashboard = () => {
    // Arahkan kembali ke dashboard guru
    router.push('/dashboard/guru')
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Panduan Cepat untuk Guru
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Selamat datang di GtxEdukids! Mulai ujian digital Anda hanya dalam 2 langkah mudah.
          </p>
        </div>

        {/* Langkah 1 */}
        <section className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">Langkah 1: Buat Ujian Baru</h2>
              <p className="text-gray-600">Tentukan detail ujian dan unggah soal PDF.</p>
            </div>
          </div>

          <div className="space-y-4 border-l-4 border-blue-200 pl-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-gray-700 mb-2">a. Isi Detail Ujian</p>
              <p className="text-sm text-gray-600">Beri nama ujian, pilih kelas, tentukan durasi, dan jenis pilihan ganda (ABCD/ABCDE).</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-gray-700 mb-2">b. Upload Soal PDF</p>
              <p className="text-sm text-gray-600">Unggah file PDF yang berisi semua soal ujian.</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="font-semibold text-blue-800 mb-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Hasil Akhir
              </p>
              <p className="text-sm text-blue-700">
                Sistem akan memberikan Anda sebuah <strong>Kode Ujian</strong> (contoh: <code className="bg-blue-100 px-1 py-0.5 rounded">MTH234</code>). 
                Berikan kode ini kepada siswa untuk memulai ujian.
              </p>
            </div>
          </div>
        </section>

        {/* Langkah 2 */}
        <section className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">Langkah 2: Upload Data Siswa</h2>
              <p className="text-gray-600">Masukkan daftar nama dan NISN siswa agar mereka bisa login.</p>
            </div>
          </div>

          <div className="space-y-4 border-l-4 border-green-200 pl-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-gray-700 mb-2 flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Proses Upload
              </p>
              <p className="text-sm text-gray-600">
                Unduh template Excel yang tersedia, isi data siswa (Nama, NISN, Kelas), lalu upload kembali file tersebut.
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="font-semibold text-green-800 mb-2 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Selesai!
              </p>
              <p className="text-sm text-green-700">
                Setelah ini, semua yang Anda butuhkan sudah ada di dashboard. Anda bisa melihat kode ujian, memantau peserta, dan melihat hasil.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">Siap untuk Memulai?</h2>
          <p className="text-lg mb-6">
            Dashboard Anda adalah pusat kendali untuk mengelola semua ujian dan melihat hasilnya.
          </p>
          <button
            onClick={handleGoToDashboard}
            className="bg-white text-blue-600 font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors shadow-lg flex items-center mx-auto"
          >
            Menuju Dashboard Guru
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </section>
      </div>
    </main>
  )
}