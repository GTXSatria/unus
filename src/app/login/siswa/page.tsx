'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Users, ArrowLeft, CheckCircle } from 'lucide-react'

function LoginSiswaContent() {
  const [kodeUjian, setKodeUjian] = useState('')
  const [nisn, setNisn] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    setMessage(searchParams.get('message') || '')
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login-siswa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ kodeUjian, nisn }),
      })

      const data = await response.json()

      if (response.ok) {
        // localStorage.setItem('siswaToken', data.token)
        localStorage.setItem('siswaData', JSON.stringify(data.siswa))
        localStorage.setItem('ujianData', JSON.stringify(data.ujian))
        router.push('/ujian')
      } else {
        setError(data.message || 'Login gagal')
      }
    } catch (error) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-300 to-blue-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center mb-6">
            <div className="bg-blue-400 p-3 rounded-2xl shadow-lg">
              <Users className="w-10 h-10 text-white" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-200 mb-2">
            Login Siswa
          </h1>
          <p className="text-gray-200">
            Masuk dengan kode ujian dan NISN
          </p>
        </div>

        <div className="bg-blue-100 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-blue-100">
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              {message}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kode Ujian
              </label>
              <input
                type="text"
                value={kodeUjian}
                onChange={(e) => setKodeUjian(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Masukkan kode ujian"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NISN
              </label>
              <input
                type="text"
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Masukkan NISN"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-br from-blue-300 to-blue-900 hover:from-blue-900 hover:to-blue-300 hover:bg-gradient-to-br text-white px-4 py-2 rounded-lg flex items-center mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Memproses...' : 'Mulai Ujian'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Pastikan kode ujian dan NISN sesuai dengan yang diberikan guru
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm inline-flex items-center">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Kembali ke beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginSiswa() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="bg-blue-400 p-3 rounded-2xl shadow-lg">
                <Users className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Login Siswa
            </h1>
            <p className="text-gray-600">
              Masuk dengan kode ujian dan NISN
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <LoginSiswaContent />
    </Suspense>
  )
}