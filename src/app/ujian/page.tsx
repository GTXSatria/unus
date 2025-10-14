'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  FileText, 
  Clock, 
  Send, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  X
} from 'lucide-react'

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
  const [ujianData, setUjianData] = useState<UjianData | null>(null)
  const [siswaData, setSiswaData] = useState<SiswaData | null>(null)
  const [jawaban, setJawaban] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [pdfUrl, setPdfUrl] = useState('')
  const [showJawaban, setShowJawaban] = useState(false)
  const router = useRouter()
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('siswaToken')
    const siswaDataStr = localStorage.getItem('siswaData')
    const ujianDataStr = localStorage.getItem('ujianData')
    
    if (!token || !siswaDataStr || !ujianDataStr) {
      router.push('/login/siswa')
      return
    }

    const siswa = JSON.parse(siswaDataStr)
    const ujian = JSON.parse(ujianDataStr)
    
    setSiswaData(siswa)
    setUjianData(ujian)
    
    // Set PDF URL
    setPdfUrl(`/api/ujian/pdf/${ujian.kodeUjian}`)

    // Check existing result and handle timer
    checkExistingResult(token, siswa.id, ujian.id)
  }, [router])

  useEffect(() => {
    if (timeLeft > 0 && !showResult) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0 && !showResult) {
      handleSubmit()
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [timeLeft, showResult])

  const checkExistingResult = async (token: string, siswaId: string, ujianId: string) => {
    try {
      const response = await fetch('/api/hasil/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ siswaId, ujianId })
      })

      const data = await response.json()
      
      if (response.ok && data.hasExistingResult) {
        // Student already has a finished result, show it directly
        setResult(data.hasil)
        setShowResult(true)
      } else if (response.ok && data.sudahMulai) {
        // Student started but didn't finish, calculate remaining time
        const startTime = new Date(data.waktuMulai)
        const currentTime = new Date()
        const elapsedMs = currentTime.getTime() - startTime.getTime()
        const elapsedSeconds = Math.floor(elapsedMs / 1000)
        const totalSeconds = ujianData?.lamaUjian ? ujianData.lamaUjian * 60 : 3600
        const remainingTime = Math.max(0, totalSeconds - elapsedSeconds)
        
        setTimeLeft(remainingTime)
        
        // If time is up, submit automatically
        if (remainingTime === 0) {
          handleSubmit()
        }
      } else {
        // Student hasn't started yet, start the exam
        await startExam(token)
        setTimeLeft(ujianData?.lamaUjian ? ujianData.lamaUjian * 60 : 3600)
      }
    } catch (error) {
      console.error('Error checking existing result:', error)
      // Fallback: start exam normally
      await startExam(token)
      setTimeLeft(ujianData?.lamaUjian ? ujianData.lamaUjian * 60 : 3600)
    }
  }

  const startExam = async (token: string) => {
    try {
      const response = await fetch('/api/ujian/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      console.log('Start exam response:', data)
    } catch (error) {
      console.error('Error starting exam:', error)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const handleJawabanChange = (soalNomor: number, value: string) => {
    setJawaban(prev => ({
      ...prev,
      [soalNomor]: value
    }))
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      const token = localStorage.getItem('siswaToken')
      const response = await fetch('/api/ujian/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jawaban })
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data.hasil)
        setShowResult(true)
      } else {
        alert(data.message || 'Terjadi kesalahan')
      }
    } catch (error) {
      alert('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FileText className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">{ujianData.namaUjian}</h1>
                <p className="text-sm text-gray-500">{siswaData.nama} - {siswaData.kelas}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center px-3 py-1 rounded-full ${
                timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                <Clock className="w-4 h-4 mr-2" />
                <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
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
        {/* PDF Fullscreen */}
        <div className="flex-1 bg-white">
          <iframe
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full"
            title="Soal Ujian PDF"
            style={{
              pointerEvents: 'none' // Disable interaction to prevent cheating
            }}
          />
        </div>

        {/* Sliding Panel untuk Lembar Jawaban */}
        <div className={`fixed top-16 right-0 h-full bg-white shadow-2xl transition-transform duration-300 ease-in-out z-30 ${
          showJawaban ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="w-96 h-full flex flex-col">
            {/* Panel Header */}
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Lembar Jawaban</h3>
              <button
                onClick={() => setShowJawaban(false)}
                className="text-white hover:bg-blue-700 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {Array.from({ length: ujianData.jumlahSoal }, (_, i) => i + 1).map((nomor) => (
                  <div key={nomor} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Soal {nomor}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        jawaban[nomor] 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {jawaban[nomor] || 'Belum dijawab'}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {getPilihanOptions().map((pilihan) => (
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
              
              {/* Submit Button in Panel */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || Object.keys(jawaban).length === 0}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Mengirim...' : 'Selesai & Kirim'}
                </button>
                
                {/* Progress Info */}
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
                      style={{ width: `${(Object.keys(jawaban).length / ujianData.jumlahSoal) * 100}%` }}
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