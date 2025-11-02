'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Heart, Copy } from "lucide-react"
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
  ChevronRight,
  HelpCircle,
  X,
  Mail,
  Send
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
  const [isPanduanOpen, setIsPanduanOpen] = useState(false)
  const [isPesanOpen, setIsPesanOpen] = useState(false)
  const [isTulisPesanOpen, setIsTulisPesanOpen] = useState(false)
  const [pesanList, setPesanList] = useState<any[]>([])
  const [pesanContent, setPesanContent] = useState('')
  const [isLoadingPesan, setIsLoadingPesan] = useState(false)
  const [expandedPesanId, setExpandedPesanId] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [ujians, setUjians] = useState<Ujian[]>([])
  const [siswaPerKelas, setSiswaPerKelas] = useState<Record<string, Siswa[]>>({})
  const [hasilUjians, setHasilUjians] = useState<HasilUjian[]>([])
  const [expandedKelas, setExpandedKelas] = useState<Record<string, boolean>>({})
  const [guruData, setGuruData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          router.push('/login/guru');
          return;
        }
        const userData = await response.json();
        setGuruData(userData);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login/guru');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (guruData) {
      fetchData();
      fetchPesan(); // <-- TAMBAHKAN INI
    }
  }, [guruData]);

    useEffect(() => {
    if (isPesanOpen) {
      markAsRead();
    }
  }, [isPesanOpen]);

  const fetchData = async () => {
    try {
      const headers = {
        'Content-Type': 'application/json',
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

const handleLogout = async () => {
  try {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    if (response.ok) {
      router.push('/login/guru');
    } else {
      console.error('Logout gagal');
    }
  } catch (error) {
    console.error('Terjadi kesalahan saat logout:', error);
  }
}

  const fetchPesan = async () => {
    try {
      const response = await fetch('/api/pesan');
      if (response.ok) {
        const data = await response.json();
        
        // --- LOGIKA UNTUK MEMBERSIHKAN DUPLIKAT PESAN ---
        const uniquePesanList = data.messages.filter((pesan, index, self) =>
          index === self.findIndex((p) => p.id === pesan.id)
        );

        setPesanList(uniquePesanList);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Gagal mengambil pesan:', error);
    }
  };

  const handleTulisPesan = async () => {
    if (!pesanContent.trim()) {
      alert('Pesan tidak boleh kosong.');
      return;
    }
    setIsLoadingPesan(true);
    try {
      const response = await fetch('/api/pesan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isi: pesanContent }),
      });

      if (response.ok) {
        setPesanContent('');
        setIsTulisPesanOpen(false);
        fetchPesan(); // Refresh daftar pesan
        alert('Saran berhasil dikirim!');
      } else {
        alert('Gagal mengirim pesan.');
      }
    } catch (error) {
      console.error('Gagal mengirim pesan:', error);
      alert('Terjadi kesalahan saat mengirim pesan.');
    } finally {
      setIsLoadingPesan(false);
    }
  };

  const handleHapusPesan = async (path: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pesan ini?')) return;
    
    try {
      const response = await fetch(`/api/pesan/${path}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPesan(); // Refresh daftar pesan
      } else {
        alert('Gagal menghapus pesan.');
      }
    } catch (error) {
      console.error('Gagal menghapus pesan:', error);
      alert('Terjadi kesalahan saat menghapus pesan.');
    }
  };

  const markAsRead = async () => {
    try {
      await fetch('/api/pesan/mark-as-read', { method: 'POST' });
      setUnreadCount(0); // Langsung update state agar titik merah hilang
    } catch (error) {
      console.error('Gagal menandai pesan sebagai dibaca:', error);
    }
  };

  const handleDeleteUjian = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus ujian ini?')) return

    try {
      const response = await fetch(`/api/ujian/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
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
      const response = await fetch(`/api/siswa/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
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
      const response = await fetch(`/api/siswa/kelas/${kelas}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
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
      const response = await fetch(`/api/hasil-ujian/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setHasilUjians(hasilUjians.filter(h => h.id !== id))
      }
    } catch (error) {
      console.error('Error deleting hasil:', error)
    }
  }

  const handleDeleteHasilPerKelas = async (kelas: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus semua hasil ujian kelas ${kelas}?`)) return

    try {
      const response = await fetch(`/api/hasil-ujian/kelas/${kelas}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        fetchData()
      } else {
        alert('Gagal menghapus hasil ujian kelas ini')
      }
    } catch (error) {
      console.error('Error deleting hasil per kelas:', error)
      alert('Terjadi kesalahan saat menghapus hasil ujian kelas ini')
    }
  }

  const handleDeleteKunciJawaban = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kunci jawaban ini?')) return

    try {
      const response = await fetch(`/api/ujian/${id}/kunci-jawaban`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
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

  const handleCopy = (text: string) => {
  navigator.clipboard.writeText(text)
    .then(() => alert("Nomor rekening telah disalin!"))
    .catch(() => alert("Gagal menyalin nomor rekening"));
};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-500 shadow-lg border-b border-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-white mr-3" />
              <div>
                <h1 className="text-xl font-bold text-white">GTX Core</h1>
                <p className="text-sm text-white">Dashboard Guru</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
                {/* --- TAMBAHKAN KODE INI --- */}
                {guruData?.role === 'ADMIN' && (
                <Link
                href="/dashboard/admin"
                className="bg-purple-200 text-white px-4 py-2 rounded-lg hover:bg-purple-400 flex items-center"
                >
                Menu Admin
                </Link>
                )}

{/* --- DROPDOWN PESAN (VERSII TABEL TANPA AKSI) --- */}
<div className="relative">
  <button
    onClick={() => setIsPesanOpen(!isPesanOpen)}
    className="text-white hover:text-white p-2 rounded-lg hover:bg-blue-900 relative"
  >
    <Mail className="w-5 h-5" />
    {unreadCount > 0 && (
      <span className="absolute top-1 right-1 h-2 w-2 bg-yellow-500 rounded-full"></span>
    )}
  </button>

  {isPesanOpen && (
    <div className="absolute right-0 mt-2 w-[600px] bg-white rounded-lg shadow-lg border z-20">
      {/* Header Dropdown */}
      <div className="p-3 border-b flex justify-between items-center">
        <h3 className="text-sm font-semibold text-blue-900">Pesan Masuk</h3>
        <button
          onClick={() => setIsPesanOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tombol Tulis Pesan */}
      <div className="p-3 border-b">
        <button
          onClick={() => { setIsTulisPesanOpen(true); setIsPesanOpen(false); }}
          className="w-full text-left text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          + Tulis Pesan (Saran & Kritik)
        </button>
      </div>

      {/* Tabel Pesan */}
      <div className="max-h-80 overflow-y-auto">
        {pesanList.length > 0 ? (
          <table className="min-w-full divide-y divide-blue-500">
            <thead className="bg-blue-500">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">Dari</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">Judul</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">Isi Pesan</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">Tanggal</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-blue-500">
              {pesanList.map((pesan) => (
                <tr key={pesan.id}>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <p className="text-xs font-medium text-blue-500">{pesan.dari}</p>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <p className="text-xs text-gray-500">{pesan.judul}</p>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {expandedPesanId === pesan.id ? (
                      <>
                        <p>{pesan.isi}</p>
                        <button
                          onClick={() => setExpandedPesanId(null)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          Tutup
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="line-clamp-2">{pesan.isi}</p>
                        {pesan.isi.length > 150 && (
                          <button
                            onClick={() => setExpandedPesanId(pesan.id)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >
                            Lihat Selengkapnya
                          </button>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                    {new Date(pesan.createdAt).toLocaleDateString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-4 text-center text-sm text-gray-500">
            Belum ada pesan.
          </div>
        )}
      </div>
    </div>
  )}
</div>

            <button
              onClick={() => setIsPanduanOpen(true)}
              className="text-white hover:text-blue-900 flex items-center text-lg font-bold"
              >
              <HelpCircle className="w-5 h-5 mr-2" />
              Panduan
              </button>

              <span className="text-white font-bold">
                {guruData?.name}
              </span>
              <button
                onClick={handleLogout}
                className="text-white hover:text-blue-900 flex items-center text-lg font-bold"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-blue-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'ujian', label: 'Upload Ujian', icon: Upload },
              { id: 'kunci', label: 'Kunci Jawaban', icon: FileText },
              { id: 'siswa', label: 'Data Siswa', icon: Users },
              { id: 'hasil', label: 'Hasil Ujian', icon: FileText },
              { id: 'donasi', label: 'Donasi'}
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-900 text-blue-900'
                    : 'border-transparent text-blue-500 hover:text-blue-900 hover:border-blue-900'
                }`}
              >
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
              <h2 className="text-2xl font-bold text-blue-500">Upload Ujian</h2>
              <Link
                href="/dashboard/guru/upload-ujian"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Upload Ujian Baru
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-blue-500">
                <thead className="bg-blue-500">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Kode Ujian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Nama Ujian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Kelas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Jumlah Soal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Lama Ujian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {ujians.map((ujian) => (
                    <tr key={ujian.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-500">
                        {ujian.kodeUjian}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500">
                        {ujian.namaUjian}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500">
                        {ujian.kelas}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500">
                        {ujian.jumlahSoal}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500">
                        {ujian.lamaUjian} menit
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            href={`/dashboard/guru/edit-ujian/${ujian.id}`}
                            className="text-red-900 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteUjian(ujian.id)}
                            className="text-red-900 hover:text-blue-900"
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
                  <p className="text-gray-500 mb-4">Belum ada ujian yang diupload</p>
                  <p className="text-sm text-gray-400">
                    Baru menggunakan aplikasi?{' '}
                    <button
                      onClick={() => setIsPanduanOpen(true)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Lihat Panduan Cepat
                    </button>
                    {' '}untuk memulai.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Kunci Jawaban Tab */}
        {activeTab === 'kunci' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-blue-500">Kunci Jawaban</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => window.location.href = '/dashboard/guru/kunci-jawaban/upload'}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Kunci Jawaban
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-blue-500">
                <thead className="bg-blue-500">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Kode Ujian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Nama Ujian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Kelas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Status Kunci
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-blue-500">
                  {ujians.map((ujian) => {
                    const hasKunci = ujian.kunciJawaban && ujian.kunciJawaban !== '{}' && ujian.kunciJawaban !== 'null'
                    return (
                      <tr key={ujian.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-500">
                          {ujian.kodeUjian}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500">
                          {ujian.namaUjian}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500">
                          {ujian.kelas}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {hasKunci ? (
                            <span className="bg-green-400 text-white px-2 py-1 rounded-full text-xs">
                              Sudah Ada
                            </span>
                          ) : (
                            <span className="bg-red-400 text-white px-2 py-1 rounded-full text-xs">
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
              <h2 className="text-2xl font-bold text-blue-500">Data Siswa</h2>
              <Link
                href="/dashboard/guru/upload-siswa"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
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
                      <h3 className="text-lg font-semibold text-blue-500">Kelas {kelas}</h3>
                      <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                        {siswaList.length} siswa
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSiswaPerKelas(kelas)
                      }}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      Hapus Kelas
                    </button>
                  </div>
                  
                  {expandedKelas[kelas] && (
                    <div className="divide-y divide-gray-200">
                      {siswaList.map((siswa) => (
                        <div key={siswa.id} className="px-6 py-4 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-blue-500">{siswa.nama}</p>
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
              <h2 className="text-2xl font-bold text-blue-500">Hasil Ujian</h2>
              <button 
                onClick={handleExportAll}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
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
                      <h3 className="text-lg font-semibold text-blue-500">
                        Kelas {kelas}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
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
                          handleDeleteHasilPerKelas(kelas)
                        }}
                        className="text-red-600 hover:text-red-700 text-sm flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Hapus Kelas
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExportPerKelas(kelas, hasilList)
                        }}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center"
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
                    <table className="min-w-full divide-y divide-blue-500">
                      <thead className="bg-blue-500">
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
                      <tbody className="bg-white divide-y divide-blue-500">
                        {hasilList.map((hasil) => (
                          <tr key={hasil.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-500">
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

        {activeTab === 'donasi' && (
          <div className="p-6 bg-white rounded-lg shadow-sm border border-blue-500">
            <h2 className="text-center text-2xl font-bold text-blue-700 mb-1">
              ❤️ Jazakumullah khoiron katsiron
            </h2>
            <p className="text-sm text-black text-center mb-6">
              Terima kasih telah mendukung pengembangan aplikasi CBT ini 🙏
            </p>

            <div className="space-y-5 max-w-md mx-auto">

              {/* BJB */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-blue-800">Bank BJB</p>
                    <p className="text-blue-500 font-medium">0142842068100</p>
                    <p className="text-xs text-gray-600">A.n: Ade Susandi, S.Pd</p>
                  </div>
                  <button
                    onClick={() => handleCopy("0142842068100")}
                    className="text-blue-700 hover:text-blue-900"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* BRI */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-blue-800">Bank BRI</p>
                    <p className="text-blue-500 font-medium">445601016460536</p>
                    <p className="text-xs text-gray-600">A.n: Ade Susandi, S.Pd</p>
                  </div>
                  <button
                    onClick={() => handleCopy("445601016460536")}
                    className="text-blue-700 hover:text-blue-900"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Crypto */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="w-[100%]">
                    <p className="font-semibold text-blue-800">Dompet (Wallet)</p>
                    <p className="text-blue-500 font-medium break-all">
                      0x4d9b5f58f02aaaf71d4a978f07cd21572e082966
                    </p>
                    <p className="text-xs text-gray-600">A.n: Ksdoel</p>
                  </div>
                  <button
                    onClick={() => handleCopy("0x4d9b5f58f02aaaf71d4a978f07cd21572e082966")}
                    className="text-blue-700 hover:text-blue-900"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>

            </div>

            <p className="text-center text-[11px] text-blue-500 mt-6">
              Donasi Anda sangat berarti untuk keberlanjutan dan update fitur.
            </p>
          </div>
        )}
      </main>

      {/* Modal Panduan Cepat */}
      {isPanduanOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-blue-500">Panduan Cepat Penggunaan Aplikasi</h2>
                <button
                  onClick={() => setIsPanduanOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-blue-500 mb-2">1. Upload Ujian (Real/Dummy)</h3>
                  <p className="text-gray-600 text-sm">
                    Klik tab "Upload Ujian" lalu klik tombol "Upload Ujian Baru" untuk menambahkan soal ujian baru, 
                    Soal pdf bisa file apa saja untuk melakukan Dummy tidak harus lembar soal.
                    dan pastikan soal Real/Dumy format pdf.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-blue-500 mb-2">2. Upload Data Siswa (Real/Dummy)</h3>
                  <p className="text-gray-600 text-sm">
                    Klik tab "Data Siswa" lalu klik "Upload Data Siswa" untuk menambahkan data siswa.
                    Data siswa diperlukan untuk login dan penilaian, untuk format data siswa lihat Template. 
                    (Untuk Test Dummy nama dan No NISN bisa mengarang)
                    untuk ujian real NISN bisa di ganti dengan nomor apapun Syarat nomor Unik zero kemungkinan 
                    data yang sama antar siswa.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-blue-500 mb-2">3. Melihat Hasil Ujian (Real/Dummy)</h3>
                  <p className="text-gray-600 text-sm">
                    Klik tab "Hasil Ujian" untuk melihat hasil ujian siswa.
                    Anda dapat melihat hasil per kelas atau mengekspor semua hasil dalam format CSV.
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Tips Tambahan</h3>
                  <ul className="text-blue-800 text-sm space-y-1 list-disc list-inside">
                    <li>Gunakan format file yang sesuai untuk menghindari kesalahan saat upload</li>
                    <li>Periksa kembali data sebelum menyimpan</li>
                    <li>Backup data secara berkala untuk menghindari kehilangan data</li>
                    <li>Untuk pertanyaan lebih lanjut, hubungi administrator sistem</li>
                    <li>Anda Bisa mengirim pesan saran atau kritik ke admin dengan klik logo amplop/pesan</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsPanduanOpen(false)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Mengerti
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isTulisPesanOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-blue-500">Kirim Saran & Kritik</h2>
                <button
                  onClick={() => setIsTulisPesanOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <textarea
                value={pesanContent}
                onChange={(e) => setPesanContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                rows={6}
                placeholder="Tuliskan saran atau kritik Anda di sini..."
              ></textarea>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => setIsTulisPesanOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  onClick={handleTulisPesan}
                  disabled={isLoadingPesan}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
                >
                  {isLoadingPesan ? 'Mengirim...' : 'Kirim'}
                  <Send className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}