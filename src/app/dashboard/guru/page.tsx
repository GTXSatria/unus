'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  BookOpen, 
  Upload, 
  Users, 
  FileText, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit,
  Eye,
  Download,
  ChevronDown,
  ChevronRight
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
  createdAt: string
}

interface Siswa {
  id: string
  nisn: string
  nama: string
  kelas: string
}

interface HasilUjian {
  id: string
  ujian: {
    kodeUjian: string
    namaUjian: string
  }
  siswa: {
    nisn: string
    nama: string
    kelas: string
  }
  skor: number
  benar: number
  salah: number
  createdAt: string
}

export default function DashboardGuru() {
  const [activeTab, setActiveTab] = useState('ujian')
  const [ujians, setUjians] = useState<Ujian[]>([])
  const [siswaPerKelas, setSiswaPerKelas] = useState<Record<string, Siswa[]>>({})
  const [hasilUjians, setHasilUjians] = useState<HasilUjian[]>([])
  const [expandedKelas, setExpandedKelas] = useState<Record<string, boolean>>({})
  const [guruData, setGuruData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('guruToken')
    const userData = localStorage.getItem('guruData')
    
    if (!token || !userData) {
      router.push('/login/guru')
      return
    }

    setGuruData(JSON.parse(userData))
    fetchData()
  }, [router])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('guruToken')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const [ujianRes, siswaRes, hasilRes] = await Promise.all([
        fetch('/api/ujian', { headers }),
        fetch('/api/siswa', { headers }),
        fetch('/api/hasil-ujian', { headers })
      ])

      if (ujianRes.ok) {
        const ujianData = await ujianRes.json()
        setUjians(ujianData)
      }

      if (siswaRes.ok) {
        const siswaData = await siswaRes.json()
        const grouped: Record<string, Siswa[]> = {}
        siswaData.forEach((siswa: Siswa) => {
          if (!grouped[siswa.kelas]) {
            grouped[siswa.kelas] = []
          }
          grouped[siswa.kelas].push(siswa)
        })
        setSiswaPerKelas(grouped)
      }

      if (hasilRes.ok) {
        const hasilData = await hasilRes.json()
        setHasilUjians(hasilData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('guruToken')
    localStorage.removeItem('guruData')
    router.push('/')
  }

  const handleDeleteUjian = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus ujian ini?')) return

    try {
      const token = localStorage.getItem('guruToken')
      const response = await fetch(`/api/ujian/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchData()
      } else {
        const errorData = await response.json()
        alert(errorData.message || 'Gagal menghapus ujian')
      }
    } catch (error) {
      console.error('Error deleting ujian:', error)
      alert('Terjadi kesalahan saat menghapus ujian')
    }
  }

  const handleDeleteSiswa = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus siswa ini?')) return

    try {
      const token = localStorage.getItem('guruToken')
      const response = await fetch(`/api/siswa/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error deleting siswa:', error)
    }
  }

  const handleDeleteSiswaPerKelas = async (kelas: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus semua siswa kelas ${kelas}?`)) return

    try {
      const token = localStorage.getItem('guruToken')
      const response = await fetch(`/api/siswa/kelas/${kelas}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error deleting siswa per kelas:', error)
    }
  }

  const handleDeleteHasil = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus hasil ujian ini?')) return

    try {
      const token = localStorage.getItem('guruToken')
      const response = await fetch(`/api/hasil-ujian/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setHasilUjians(hasilUjians.filter(h => h.id !== id))
      }
    } catch (error) {
      console.error('Error deleting hasil:', error)
    }
  }

  const handleDeleteKunciJawaban = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kunci jawaban ini?')) return

    try {
      const token = localStorage.getItem('guruToken')
      const response = await fetch(`/api/ujian/${id}/kunci-jawaban`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error deleting kunci jawaban:', error)
    }
  }

  const toggleKelas = (kelas: string) => {
    setExpandedKelas(prev => ({
      ...prev,
      [kelas]: !prev[kelas]
    }))
  }

  const exportToExcel = (data: any[], filename: string) => {
    const headers = ['Kode Ujian', 'Nama Siswa', 'NISN', 'Kelas', 'Skor', 'Benar', 'Salah', 'Tanggal']
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.ujian.kodeUjian,
        row.siswa.nama,
        row.siswa.nisn,
        row.siswa.kelas,
        row.skor + '%',
        row.benar,
        row.salah,
        new Date(row.createdAt).toLocaleDateString('id-ID')
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportAll = () => {
    exportToExcel(hasilUjians, `hasil-ujian-semua-kelas-${new Date().toISOString().split('T')[0]}`)
  }

  const handleExportPerKelas = (kelas: string, hasilList: HasilUjian[]) => {
    exportToExcel(hasilList, `hasil-ujian-kelas-${kelas}-${new Date().toISOString().split('T')[0]}`)
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
              <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">GTX EduKids</h1>
                <p className="text-sm text-gray-500">Dashboard Guru</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-blue-600">
                {guruData?.name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'ujian', label: 'Upload Ujian', icon: Upload },
              { id: 'kunci', label: 'Kunci Jawaban', icon: FileText },
              { id: 'siswa', label: 'Data Siswa', icon: Users },
              { id: 'hasil', label: 'Hasil Ujian', icon: FileText }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Ujian Tab */}
        {activeTab === 'ujian' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Upload Ujian</h2>
              <Link
                href="/dashboard/guru/upload-ujian"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Upload Ujian Baru
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
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
                      Lama Ujian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
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
                        {ujian.lamaUjian} menit
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            href={`/dashboard/guru/edit-ujian/${ujian.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteUjian(ujian.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ujians.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Belum ada ujian yang diupload</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Kunci Jawaban Tab */}
        {activeTab === 'kunci' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Kunci Jawaban</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => window.location.href = '/dashboard/guru/kunci-jawaban/upload'}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Kunci Jawaban
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
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
                      Status Kunci
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ujians.map((ujian) => {
                    const hasKunci = ujian.kunciJawaban && ujian.kunciJawaban !== '{}' && ujian.kunciJawaban !== 'null'
                    return (
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {hasKunci ? (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                              Sudah Ada
                            </span>
                          ) : (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                              Belum Ada
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => window.location.href = `/dashboard/guru/kunci-jawaban/${ujian.id}`}
                              className="text-blue-600 hover:text-blue-900"
                              title="Lihat/Edit Kunci Jawaban"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {hasKunci && (
                              <button
                                onClick={() => handleDeleteKunciJawaban(ujian.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Hapus Kunci Jawaban"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {ujians.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Belum ada ujian yang diupload</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data Siswa Tab */}
        {activeTab === 'siswa' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Data Siswa</h2>
              <Link
                href="/dashboard/guru/upload-siswa"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Upload Data Siswa
              </Link>
            </div>

            <div className="space-y-4">
              {Object.entries(siswaPerKelas).map(([kelas, siswaList]) => (
                <div key={kelas} className="bg-white rounded-lg shadow overflow-hidden">
                  <div
                    className="bg-gray-50 px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleKelas(kelas)}
                  >
                    <div className="flex items-center">
                      {expandedKelas[kelas] ? (
                        <ChevronDown className="w-5 h-5 mr-2 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 mr-2 text-gray-500" />
                      )}
                      <h3 className="text-lg font-semibold text-gray-900">Kelas {kelas}</h3>
                      <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                        {siswaList.length} siswa
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSiswaPerKelas(kelas)
                      }}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Hapus Kelas
                    </button>
                  </div>
                  
                  {expandedKelas[kelas] && (
                    <div className="divide-y divide-gray-200">
                      {siswaList.map((siswa) => (
                        <div key={siswa.id} className="px-6 py-4 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{siswa.nama}</p>
                            <p className="text-sm text-gray-500">NISN: {siswa.nisn}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteSiswa(siswa.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {Object.keys(siswaPerKelas).length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada data siswa</p>
              </div>
            )}
          </div>
        )}

        {/* Hasil Ujian Tab */}
        {activeTab === 'hasil' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Hasil Ujian</h2>
              <button 
                onClick={handleExportAll}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Semua Kelas
              </button>
            </div>

            {/* Group hasil ujian per kelas */}
            {Object.entries(
              hasilUjians.reduce((groups: Record<string, HasilUjian[]>, hasil) => {
                const kelas = hasil.siswa.kelas
                if (!groups[kelas]) {
                  groups[kelas] = []
                }
                groups[kelas].push(hasil)
                return groups
              }, {})
            ).map(([kelas, hasilList]) => (
              <div key={kelas} className="mb-6">
                {/* Header Kelas */}
                <div 
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleKelas(kelas)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {expandedKelas[kelas] ? (
                        <ChevronDown className="w-5 h-5 text-gray-600 mr-2" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-600 mr-2" />
                      )}
                      <h3 className="text-lg font-semibold text-gray-900">
                        Kelas {kelas}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">
                        {hasilList.length} siswa
                      </span>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">
                          Rata-rata: 
                        </span>
                        <span className="ml-1 text-blue-600 font-semibold">
                          {Math.round(hasilList.reduce((sum, h) => sum + h.skor, 0) / hasilList.length)}%
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExportPerKelas(kelas, hasilList)
                        }}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Export Kelas
                      </button>
                    </div>
                  </div>
                </div>

                {/* Detail Hasil per Kelas */}
                {expandedKelas[kelas] && (
                  <div className="mt-2 bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kode Ujian
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nama Siswa
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            NISN
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Skor
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Benar
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Salah
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {hasilList.map((hasil) => (
                          <tr key={hasil.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {hasil.ujian.kodeUjian}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {hasil.siswa.nama}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {hasil.siswa.nisn}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                hasil.skor >= 80 ? 'bg-green-100 text-green-800' :
                                hasil.skor >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {hasil.skor}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="text-green-600 font-medium">
                                {hasil.benar}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="text-red-600 font-medium">
                                {hasil.salah}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleDeleteHasil(hasil.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {hasilList.length === 0 && (
                      <div className="text-center py-8">
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Belum ada hasil ujian untuk kelas ini</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Jika tidak ada hasil sama sekali */}
            {hasilUjians.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada hasil ujian</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}