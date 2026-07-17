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

// Dynamic import dengan loading yang lebih baik
const PdfViewer = dynamic(() => import('./PdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center text-brand-muted">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--ring)] mx-auto mb-4"></div>
        <p>Memuat soal...</p>
      </div>
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
  const [error, setError] = useState<string | null>(null)
  const [isReadyForFullscreen, setIsReadyForFullscreen] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [soalBelumDijawab, setSoalBelumDijawab] = useState<number[]>([]);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);
  const [appSwitchCount, setAppSwitchCount] = useState(0);
  const router = useRouter()
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isClient = typeof window !== 'undefined'

  // Ambil data awal
  useEffect(() => {
    if (!isClient) return

    const siswaDataStr = localStorage.getItem('siswaData')
    const ujianDataStr = localStorage.getItem('ujianData')

    if (!siswaDataStr || !ujianDataStr) {
      router.push('/login/siswa')
      return
    }

    try {
      const siswa = JSON.parse(siswaDataStr)
      const ujian = JSON.parse(ujianDataStr)

      setSiswaData(siswa)
      setUjianData(ujian)

      // Build PDF URL dengan timestamp untuk cache busting
      const pdfUrl = `/api/ujian/pdf/${ujian.kodeUjian}?t=${Date.now()}`
      setPdfUrl(pdfUrl)

      setIsLoading(false)
    } catch (err) {
      console.error('Error parsing stored data:', err)
      setError('Gagal memuat data ujian')
      setIsLoading(false)
    }
  }, [router, isClient])

  // Cek hasil sebelumnya
  useEffect(() => {
    if (!ujianData || !siswaData || !isClient) return

    const initializeExam = async () => {
      try {
        await checkExistingResult(siswaData.id, ujianData.id)
      } catch (error) {
        console.error('Error during exam initialization:', error)
        setError('Gagal menginisialisasi ujian')
      }
    }

    initializeExam()
  }, [ujianData, siswaData, isClient])

  const checkExistingResult = async (siswaId: string, ujianId: string) => {
    try {
      const response = await fetch('/api/hasil/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siswaId, ujianId })
      })
      const data = await response.json()

      if (response.ok && data.hasExistingResult) {
        setResult(data.hasil)
        setShowResult(true)
      } else if (response.ok && data.sudahMulai) {
        setStartTime(new Date(data.waktuMulai))
      }
    } catch (error) {
      console.error('Error checking existing result:', error)
    }
  }

  // Mulai Ujian
  const handleStartExam = async () => {
    if (!isClient) return

    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      }

      setIsReadyForFullscreen(true)
      setHasStarted(true)

      const response = await fetch('/api/ujian/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // Anti-cheat & fullscreen
  useEffect(() => {
    if (!isReadyForFullscreen || !isClient) return

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error('Error attempting to re-enable fullscreen:', err)
        })
      }
    }

    let hiddenTime: number | null = null

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenTime = Date.now()
      } else if (hiddenTime !== null) {
        const duration = Date.now() - hiddenTime
        if (duration > 4000) {
          setAppSwitchCount((prev) => prev + 1)
        }
        hiddenTime = null
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

  // Timer
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

  // === BARU: Toggle jawaban (checkbox behavior, bukan radio) ===
  const handleJawabanChange = (soalNomor: number, value: string) => {
    setJawaban(prev => {
      const current = prev[soalNomor] || ''
      const currentLetters = current ? current.split(',').filter(Boolean) : []

      if (currentLetters.includes(value)) {
        // Deselect — hapus value
        const filtered = currentLetters.filter(l => l !== value)
        const updated = { ...prev }
        if (filtered.length === 0) {
          delete updated[soalNomor]
        } else {
          updated[soalNomor] = filtered.sort().join(',')
        }
        return updated
      } else {
        // Select — tambah value
        return {
          ...prev,
          [soalNomor]: [...currentLetters, value].sort().join(',')
        }
      }
    })
  }

  // Helper: cek apakah pilihan terpilih
  const isPilihanSelected = (nomor: number, pilihan: string): boolean => {
    const current = jawaban[nomor] || ''
    return current.split(',').includes(pilihan)
  }

  // Helper: cek apakah soal ini punya jawaban ganda
  const isJawabanGanda = (nomor: number): boolean => {
    const current = jawaban[nomor] || ''
    return current.includes(',')
  }

  const handleSubmit = async () => {
    if (!isClient) return;

    if (!ujianData || typeof ujianData.jumlahSoal !== "number" || ujianData.jumlahSoal <= 0) {
      console.warn("Data ujian tidak tersedia atau jumlah soal tidak valid.");
      return;
    }

    const totalSoal = ujianData.jumlahSoal;
    const belumDijawab: number[] = [];

    for (let i = 1; i <= totalSoal; i++) {
      if (!jawaban[i.toString()]) {
        belumDijawab.push(i);
      }
    }

    if (belumDijawab.length > 0) {
      setSoalBelumDijawab(belumDijawab);
      setShowKonfirmasi(true);
      return;
    }

    await kirimJawaban();
  };

  const kirimJawaban = async () => {
    try {
      setIsSubmitting(true);

      const response = await fetch("/api/ujian/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jawaban, appSwitchCount }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.hasil);
        setShowResult(true);
      } else if (response.status === 400) {
        console.warn("Submit 400: kemungkinan ujian sudah tersimpan sebelumnya.");
        setShowResult(true);
      } else if (response.status === 401) {
        console.warn("Sesi habis atau tidak valid.");
        router.push("/login/siswa");
      } else {
        console.error("Submit error:", data.message || "Terjadi kesalahan server.");
        setError(data.message || "Gagal mengirim jawaban");
      }
    } catch (error) {
      console.error("Submit error:", error);
      setError("Gagal mengirim jawaban");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    if (!isClient) return

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

  if (error) {
    return (
      <div className="min-h-screen bg-page-gradient flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Terjadi Kesalahan</h1>
          <p className="mb-4 text-brand-on-dark">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-brand px-6 py-3 rounded-lg font-semibold"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    )
  }

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-page-gradient flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-brand-on-dark text-2xl font-bold mb-4">Dengan menekan "Mulai Ujian" layar akan masuk Mode penuh</h1>
          <button
            onClick={handleStartExam}
            className="btn-brand px-4 py-2 rounded-lg flex items-center mx-auto"
          >
            Mulai Ujian
          </button>
        </div>
      </div>
    )
  }

  if (!ujianData || !siswaData) {
    return (
      <div className="min-h-screen bg-page-gradient flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-header mx-auto"></div>
          <p className="mt-4 text-brand-on-dark">Memuat data...</p>
        </div>
      </div>
    )
  }

  if (showResult && result) {
    return (
      <div className="min-h-screen bg-page-gradient flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-page-gradient-hover rounded-2xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-brand-on-dark mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-brand-on-dark mb-2">Ujian Selesai!</h1>
              <p className="text-brand-on-dark">Hasil ujian Anda:</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-white/20 rounded-lg p-4">
                <p className="text-sm text-brand-on-dark opacity-80 font-medium">Skor Akhir</p>
                <p className="text-3xl font-bold text-brand-on-dark">{result.skor}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-500/20 rounded-lg p-4">
                  <p className="text-sm text-green-400 font-medium">Benar</p>
                  <p className="text-2xl font-bold text-green-300">{result.benar}</p>
                </div>
                <div className="bg-red-500/20 rounded-lg p-4">
                  <p className="text-sm text-red-400 font-medium">Salah</p>
                  <p className="text-2xl font-bold text-red-300">{result.salah}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="btn-brand px-4 py-2 rounded-lg flex items-center mx-auto"
            >
              Selesai
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-brand-surface flex flex-col h-screen" data-fullscreen>
      <header className="bg-brand-header text-brand-header px-4 py-1.5 z-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img
                src="/ssc-1.PNG"
                alt="SSC Logo"
                className="h-12 w-auto object-contain"
              />
              <div>
                <h1 className="text-base sm:text-lg font-semibold text-brand-header leading-tight">{ujianData.namaUjian}</h1>
                <p className="text-xs sm:text-sm font-semibold text-brand-header leading-tight">
                  {siswaData.nama} - {siswaData.kelas}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center px-3 py-1 rounded-full ${
                  timeLeft < 300
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-brand-heading'
                }`}
              >
                <Clock className="w-4 h-4 mr-2" />
                <span className="font-mono font-semibold">
                  {formatTime(timeLeft)}
                </span>
              </div>
              <button
                onClick={() => setShowJawaban(!showJawaban)}
                className={`flex items-center px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                  showJawaban
                    ? 'btn-brand'
                    : 'bg-white text-brand-heading hover:bg-brand-surface'
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

      <div className="flex-1 min-h-0 flex relative overflow-hidden">
        <PdfViewer
          pdfUrl={pdfUrl}
          ujianData={ujianData}
          siswaData={siswaData}
        />

        {/* === LEMBAR JAWABAN (toggle behavior) === */}
        <div
          className={`fixed top-16 right-0 bottom-0 left-0 sm:left-auto bg-white shadow-2xl transition-transform duration-300 ease-in-out z-30 ${
            showJawaban ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="w-full sm:w-96 h-full flex flex-col">
            <div className="bg-brand-header text-brand-header p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Lembar Jawaban</h3>
              <button
                onClick={() => setShowJawaban(false)}
                className="text-brand-header hover:opacity-80 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-0.5">
                {Array.from({ length: ujianData.jumlahSoal }, (_, i) => i + 1).map(nomor => {
                  const currentJawaban = jawaban[nomor] || ''
                  return (
                    <div key={nomor} className="bg-white rounded-lg p-2">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="font-semibold text-black">Soal {nomor}</span>
                        <span className="text-black font-semibold">=</span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            currentJawaban
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {currentJawaban || 'Belum dijawab'}
                        </span>
                        {isJawabanGanda(nomor) && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                            GANDA
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-5 gap-0.5">
                        {getPilihanOptions().map(pilihan => (
                          <button
                            key={pilihan}
                            onClick={() => handleJawabanChange(nomor, pilihan)}
                            className={`p-1 rounded text-xs font-medium transition-colors border ${
                              isPilihanSelected(nomor, pilihan)
                                ? 'bg-green-600 text-white border-green-600'
                                : 'bg-white text-black border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pilihan}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-brand-surface">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || Object.keys(jawaban).length === 0}
                  className="btn-brand px-4 py-2 rounded-lg flex items-center mx-auto disabled:opacity-50 disabled:cursor-not-allowed justify-center"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Mengirim...' : 'Selesai & Kirim'}
                </button>

                <div className="mt-3 bg-page-gradient-hover rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-brand-on-dark">Progress</span>
                    <span className="text-sm text-brand-on-dark opacity-80">
                      {Object.keys(jawaban).length} / {ujianData.jumlahSoal}
                    </span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-white h-2 rounded-full transition-all duration-300"
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
      {showKonfirmasi && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-96 text-center">
            <h2 className="text-lg font-semibold text-brand-heading mb-2">Konfirmasi Pengiriman</h2>
            <p className="text-sm text-black mb-4">
              Ada soal yang belum dijawab yaitu nomor:
              <span className="font-semibold text-red-700"> {soalBelumDijawab.join(", ")} </span>
            </p>
            <p className="text-sm text-black mb-6">Apakah Anda yakin ingin mengirim jawaban sekarang?</p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowKonfirmasi(false)}
                className="px-4 py-2 rounded-lg bg-brand-surface-hover text-brand-heading hover:opacity-80 transition"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowKonfirmasi(false);
                  kirimJawaban();
                }}
                className="btn-brand px-4 py-2 rounded-lg transition"
              >
                Kirim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}