'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  FileText,
  Clock,
  Send,
  CheckCircle,
  Eye,
  EyeOff,
  X
} from 'lucide-react'

const PdfViewer = dynamic(() => import('./PdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center text-gray-500">
      Memuat soal...
    </div>
  )
})

interface UjianData {
  id: string
  kodeUjian: string
  namaUjian: string
  jumlahSoal: number
  lamaUjian: number
  tipePilihan: string
}

interface SiswaData {
  id: string
  nisn: string
  nama: string
  kelas: string
}

export default function UjianPage() {
  const [isExamStarted, setIsExamStarted] = useState(false)
  const [ujianData, setUjianData] = useState<UjianData | null>(null)
  const [siswaData, setSiswaData] = useState<SiswaData | null>(null)
  const [jawaban, setJawaban] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [showJawaban, setShowJawaban] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [isReadyForFullscreen, setIsReadyForFullscreen] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Helper function untuk client-side checks
  const isClient = typeof window !== 'undefined'

  // ------------------- Ambil data awal -------------------
  useEffect(() => {
    if (!isClient) return

    const token = localStorage.getItem('siswaToken')
    const siswaDataStr = localStorage.getItem('siswaData')
    const ujianDataStr = localStorage.getItem('ujianData')

    if (!token || !siswaDataStr || !ujianDataStr) {
      router.push('/login/siswa')
      return
    }

    try {
      const siswa = JSON.parse(siswaDataStr)
      const ujian = JSON.parse(ujianDataStr)

      setSiswaData(siswa)
      setUjianData(ujian)
      setPdfUrl(`/api/ujian/pdf/${ujian.kodeUjian}`)
      setIsLoading(false)
    } catch (err) {
      console.error('Error parsing stored data:', err)
      setError('Gagal memuat data ujian')
      setIsLoading(false)
    }
  }, [router, isClient])

  // ------------------- Cek hasil sebelumnya -------------------
  useEffect(() => {
    if (!ujianData || !siswaData || !isClient) return

    const token = localStorage.getItem('siswaToken')

    const initializeExam = async () => {
      try {
        await checkExistingResult(token!, siswaData.id, ujianData.id)
      } catch (error) {
        console.error('Error during exam initialization:', error)
        setError('Gagal menginisialisasi ujian')
      }
    }

    initializeExam()
  }, [ujianData, siswaData, isClient])

  const checkExistingResult = async (token: string, siswaId: string, ujianId: string) => {
    try {
      const response = await fetch('/api/hasil/check', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ siswaId, ujianId })
      })
      const data = await response.json()

      if (response.ok && data.hasExistingResult) {
        // Jika sudah ada hasil, tampilkan hasil
        setResult(data.hasil)
        setShowResult(true)
      } else if (response.ok && data.sudahMulai) {
        // Jika sudah mulai tapi belum selesai, set waktu mulai
        setStartTime(new Date(data.waktuMulai))
        // Jangan otomatis set isExamStarted di sini
      }
    } catch (error) {
      console.error('Error checking existing result:', error)
    }
  }

  // ------------------- Mulai Ujian -------------------
  const handleStartExam = async () => {
    if (!isClient) return

    try {
      // Coba fullscreen
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      }
      
      setIsReadyForFullscreen(true)
      setHasStarted(true)

      const token = localStorage.getItem('siswaToken')
      if (!token) {
        router.push('/login/siswa')
        return
      }

      const response = await fetch('/api/ujian/start', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Gagal memulai ujian')
        return
      }

      setStartTime(new Date(data.waktuMulai))
      if (ujianData?.lamaUjian) {
        setTimeLeft(ujianData.lamaUjian * 60)
      }

      setIsExamStarted(true)
    } catch (err) {
      console.error('Gagal mengaktifkan fullscreen:', err)
      alert('Browser Anda tidak mengizinkan fullscreen otomatis. Tekan F11 untuk manual.')
      setIsReadyForFullscreen(true)
      setHasStarted(true)
    }
  }

  // ------------------- Anti-cheat & fullscreen -------------------
  useEffect(() => {
    if (!isReadyForFullscreen || !isClient) return

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error('Error attempting to re-enable fullscreen:', err)
        })
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.warn('Peringatan: Siswa mencoba mengganti tab atau meminimalkan jendela.')
      }
    }

    const blockKeys = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && ['p', 's', 'u', 'c', 'r'].includes(e.key.toLowerCase())) ||
        (e.altKey && e.key === 'Tab') ||
        (e.key === 'PrintScreen')
      ) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    const blockRightClick = (e: MouseEvent) => e.preventDefault()

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('keydown', blockKeys, true)
    document.addEventListener('contextmenu', blockRightClick)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('keydown', blockKeys, true)
      document.removeEventListener('contextmenu', blockRightClick)
    }
  }, [isReadyForFullscreen, isClient])

  // ------------------- Timer -------------------
  useEffect(() => {
    if (!hasStarted || !startTime || !isExamStarted) return

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [hasStarted, startTime, isExamStarted])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // ------------------- Jawaban -------------------
  const handleJawabanChange = (soalNomor: number, value: string) => {
    setJawaban(prev => ({
      ...prev,
      [soalNomor]: value
    }))
  }

  const handleSubmit = async () => {
    if (!isClient) return

    try {
      setIsSubmitting(true)

      const token = localStorage.getItem('siswaToken')
      if (!token) {
        router.push('/login/siswa')
        return
      }

      const response = await fetch('/api/ujian/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jawaban }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data.hasil)
        setShowResult(true)
        try { 
          if (document.exitFullscreen) {
            await document.exitFullscreen() 
          }
        } catch (err) { 
          console.warn(err) 
        }
      } else if (response.status === 400) {
        console.warn('Submit 400: kemungkinan ujian sudah tersimpan sebelumnya.')
        setShowResult(true)
        try { 
          if (document.exitFullscreen) {
            await document.exitFullscreen() 
          }
        } catch (err) { 
          console.warn(err) 
        }
      } else if (response.status === 401) {
        console.warn('Token tidak valid atau sesi habis.')
        router.push('/login/siswa')
      } else {
        console.error('Submit error:', data.message || 'Terjadi kesalahan server.')
        setError(data.message || 'Gagal mengirim jawaban')
      }
    } catch (error) {
      console.error('Submit error:', error)
      setError('Gagal mengirim jawaban')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    if (!isClient) return
    
    localStorage.removeItem('siswaToken')
    localStorage.removeItem('siswaData')
    localStorage.removeItem('ujianData')
    router.push('/')
  }

  const getPilihanOptions = () => {
    if (!ujianData) return []
    return ujianData.tipePilihan === 'ABCDE'
      ? ['A', 'B', 'C', 'D', 'E']
      : ['A', 'B', 'C', 'D']
  }

  // ------------------- Render -------------------
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Terjadi Kesalahan</h1>
          <p className="mb-4 text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    )
  }

  if (!hasStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Awali Dengan Do'a</h1>
          <button
            onClick={handleStartExam}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Mulai Ujian
          </button>
        </div>
      </div>
    )
  }

  if (!ujianData || !siswaData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    )
  }

  if (showResult && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Ujian Selesai!</h1>
              <p className="text-gray-600">Hasil ujian Anda:</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">Skor Akhir</p>
                <p className="text-3xl font-bold text-blue-900">{result.skor}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium">Benar</p>
                  <p className="text-2xl font-bold text-green-900">{result.benar}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-600 font-medium">Salah</p>
                  <p className="text-2xl font-bold text-red-900">{result.salah}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Selesai
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 flex flex-col" data-fullscreen>
      <header className="bg-white shadow-sm border-b relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FileText className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">{ujianData.namaUjian}</h1>
                <p className="text-sm text-gray-500">
                  {siswaData.nama} - {siswaData.kelas}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center px-3 py-1 rounded-full ${
                  timeLeft < 300
                    ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                <Clock className="w-4 h-4 mr-2" />
                <span className="font-mono font-semibold">
                  {formatTime(timeLeft)}
                </span>
              </div>
              <button
                onClick={() => setShowJawaban(!showJawaban)}
                className={`flex items-center px-3 py-1 rounded-lg text-sm transition-colors ${
                  showJawaban
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showJawaban ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Sembunyikan Jawaban
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Lihat Jawaban
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex relative">
        <PdfViewer
          pdfUrl={pdfUrl}
          token={isClient ? localStorage.getItem('siswaToken') : null}
          ujianData={ujianData}
        />

        <div
          className={`fixed top-16 right-0 h-full bg-white shadow-2xl transition-transform duration-300 ease-in-out z-30 ${
            showJawaban ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="w-96 h-full flex flex-col">
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Lembar Jawaban</h3>
              <button
                onClick={() => setShowJawaban(false)}
                className="text-white hover:bg-blue-700 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {Array.from({ length: ujianData.jumlahSoal }, (_, i) => i + 1).map(nomor => (
                  <div key={nomor} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Soal {nomor}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          jawaban[nomor]
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {jawaban[nomor] || 'Belum dijawab'}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {getPilihanOptions().map(pilihan => (
                        <button
                          key={pilihan}
                          onClick={() => handleJawabanChange(nomor, pilihan)}
                          className={`p-1 rounded text-xs font-medium transition-colors ${
                            jawaban[nomor] === pilihan
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pilihan}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || Object.keys(jawaban).length === 0}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Mengirim...' : 'Selesai & Kirim'}
                </button>

                <div className="mt-3 bg-blue-50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-blue-900">Progress</span>
                    <span className="text-sm text-blue-700">
                      {Object.keys(jawaban).length} / {ujianData.jumlahSoal}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(Object.keys(jawaban).length / ujianData.jumlahSoal) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}