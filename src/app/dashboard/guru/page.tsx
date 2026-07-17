'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Heart, Copy } from "lucide-react"
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from "next/image";

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
  Send,
  UserPlus,
  Save,
  Menu
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
  appSwitchCount: number
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

  // === State untuk Tambah Siswa ===
  const [tambahKelas, setTambahKelas] = useState<string>('')
  const [showTambahForm, setShowTambahForm] = useState(false)
  const [tambahRows, setTambahRows] = useState<Array<{ nisn: string; nama: string }>>([
    { nisn: '', nama: '' }
  ])
  const [isSavingSiswa, setIsSavingSiswa] = useState(false)
  const [tambahError, setTambahError] = useState('')
  const [tambahSuccess, setTambahSuccess] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
      fetchPesan();
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
        fetchPesan();
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
        fetchPesan();
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
      setUnreadCount(0);
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

  // === Handler Tambah Siswa ===
  const openTambahForm = (kelas: string) => {
    setTambahKelas(kelas)
    setTambahRows([{ nisn: '', nama: '' }])
    setTambahError('')
    setTambahSuccess('')
    setShowTambahForm(true)
  }

  const updateTambahRow = (index: number, field: 'nisn' | 'nama', value: string) => {
    setTambahRows(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addTambahRow = () => {
    setTambahRows(prev => [...prev, { nisn: '', nama: '' }])
  }

  const removeTambahRow = (index: number) => {
    if (tambahRows.length <= 1) return
    setTambahRows(prev => prev.filter((_, i) => i !== index))
  }

  const handleTambahSiswa = async () => {
    const validRows = tambahRows.filter(r => r.nisn.trim() && r.nama.trim())
    if (validRows.length === 0) {
      setTambahError('Isi minimal 1 data siswa (NISN dan Nama)')
      return
    }

    setIsSavingSiswa(true)
    setTambahError('')
    setTambahSuccess('')

    try {
      const response = await fetch('/api/siswa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siswa: validRows.map(r => ({
            nisn: r.nisn.trim(),
            nama: r.nama.trim(),
            kelas: tambahKelas
          }))
        })
      })

      const data = await response.json()

      if (response.ok) {
        setTambahSuccess(data.message)
        fetchData()
        setTimeout(() => setShowTambahForm(false), 1500)
      } else {
        setTambahError(data.message || 'Gagal menambahkan siswa')
      }
    } catch (error) {
      setTambahError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsSavingSiswa(false)
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
      <div className="min-h-screen bg-page-gradient flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-header mx-auto"></div>
          <p className="mt-4 text-brand-on-dark">Memuat data...</p>
        </div>
      </div>
    )
  }

  const handleCopy = (text: string) => {
  navigator.clipboard.writeText(text)
    .then(() => alert("Nomor rekening telah disalin!"))
    .catch(() => alert("Gagal menyalin nomor rekening"));
};

  const downloadKunciTemplate = () => {
    const templateContent = [
      ['Nomor', 'Jawaban'],
      ['1', 'A'],
      ['2', 'A-C-E'],
      ['3', 'B']
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
      <header className="bg-brand-header">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Image
                src="/ssc.png"
                alt="ssc Logo"
                width={60}
                height={34}
                className="object-contain"
                priority
              />
              <p className="text-sm text-brand-header font-bold m-0 p-0 leading-tight hidden sm:block">
                Dashboard Guru
              </p>
            </div>

            {/* Desktop menu (hidden on mobile) */}
            <div className="hidden md:flex items-center space-x-4">
                {guruData?.role === 'ADMIN' && (
                <Link
                href="/dashboard/admin"
                className="bg-brand-surface text-brand-link px-4 py-2 rounded-lg hover:opacity-80 flex items-center"
                >
                Menu Admin
                </Link>
                )}

{/* --- DROPDOWN PESAN (Desktop) --- */}
<div className="relative">
  <button
    onClick={() => setIsPesanOpen(!isPesanOpen)}
    className="text-brand-header p-2 rounded-lg hover:opacity-80 relative"
  >
    <Mail className="w-5 h-5" />
    {unreadCount > 0 && (
      <span className="absolute top-1 right-1 h-2 w-2 bg-yellow-500 rounded-full"></span>
    )}
  </button>

  {isPesanOpen && (
    <div className="absolute right-0 mt-0 w-72 sm:w-96 lg:w-[600px] bg-brand-header rounded-lg shadow-lg border border-brand-surface z-50">
      {/* Header Dropdown */}
      <div className="p-3 border-b border-brand-surface flex justify-between items-center">
        <h3 className="text-sm font-semibold text-brand-on-dark">Pesan Masuk</h3>
        <button
          onClick={() => setIsPesanOpen(false)}
          className="text-brand-on-dark hover:opacity-80"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tombol Tulis Pesan */}
      <div className="bg-brand-surface text-brand-link px-4 py-2 rounded-lg hover:opacity-80 flex items-center">
        <button
          onClick={() => { setIsTulisPesanOpen(true); setIsPesanOpen(false); }}
          className="w-full text-left text-sm font-medium text-brand-link hover:text-brand-link-hover"
        >
          + Saran & Kritik (Klik Disini)
        </button>
      </div>

      {/* Tabel Pesan */}
      <div className="max-h-80 overflow-y-auto">
        {pesanList.length > 0 ? (
          <div className="divide-y divide-brand-surface">
            {pesanList.map((pesan) => (
              <div key={pesan.id} className="p-3 hover:bg-brand-surface/50">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs font-medium text-brand-link">{pesan.dari}</p>
                  <span className="text-[10px] text-brand-muted flex-shrink-0 ml-2">
                    {new Date(pesan.createdAt).toLocaleDateString('id-ID')}
                  </span>
                </div>
                <p className="text-xs font-medium text-brand-muted mb-1">{pesan.judul}</p>
                <p className="text-sm text-brand-body">
                  {expandedPesanId === pesan.id ? (
                    <>
                      <p>{pesan.isi}</p>
                      <button
                        onClick={() => setExpandedPesanId(null)}
                        className="text-brand-link hover:text-brand-link-hover text-xs font-medium mt-1"
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
                          className="text-brand-link hover:text-brand-link-hover text-xs font-medium mt-1"
                        >
                          Lihat Selengkapnya
                        </button>
                      )}
                    </>
                  )}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-brand-muted">
            Belum ada pesan.
          </div>
        )}
      </div>
    </div>
  )}
</div>

            <button
              onClick={() => setIsPanduanOpen(true)}
              className="text-brand-header hover:opacity-80 flex items-center text-lg font-bold"
              >
              <HelpCircle className="w-5 h-5 mr-2" />
              Panduan
              </button>

              <span className="text-brand-header font-bold text-sm">
                {guruData?.name}
              </span>
              <button
                onClick={handleLogout}
                className="btn-brand px-3 py-1.5 rounded-lg flex items-center text-sm">
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </button>
            </div>

            {/* Mobile hamburger button (hidden on desktop) */}
            <button
              className="md:hidden text-brand-header p-2 rounded-lg hover:opacity-80 relative"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile dropdown menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-brand-surface pb-3">
              {/* Guru name */}
              <div className="px-4 py-2 text-brand-header font-bold text-sm">
                {guruData?.name}
              </div>

              {/* Admin link */}
              {guruData?.role === 'ADMIN' && (
                <Link
                  href="/dashboard/admin"
                  className="flex items-center px-4 py-2 text-brand-link hover:opacity-80"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Menu Admin
                </Link>
              )}

              {/* Pesan */}
              <button
                onClick={() => { setIsPesanOpen(!isPesanOpen); }}
                className="flex items-center w-full text-left px-4 py-2 text-brand-header hover:opacity-80 relative"
              >
                <Mail className="w-5 h-5 mr-3" />
                Pesan
                {unreadCount > 0 && (
                  <span className="ml-2 h-2 w-2 bg-yellow-500 rounded-full"></span>
                )}
              </button>

              {/* Mobile pesan panel */}
              {isPesanOpen && (
                <div className="mx-3 mb-2 bg-brand-header rounded-lg shadow-lg border border-brand-surface">
                  <div className="p-3 border-b border-brand-surface flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-brand-on-dark">Pesan Masuk</h3>
                    <button onClick={() => setIsPesanOpen(false)} className="text-brand-on-dark hover:opacity-80">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="bg-brand-surface px-4 py-2">
                    <button
                      onClick={() => { setIsTulisPesanOpen(true); setIsPesanOpen(false); setIsMobileMenuOpen(false); }}
                      className="w-full text-left text-sm font-medium text-brand-link hover:text-brand-link-hover"
                    >
                      + Saran & Kritik (Klik Disini)
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {pesanList.length > 0 ? (
                      <div className="divide-y divide-brand-surface">
                        {pesanList.map((pesan) => (
                          <div key={pesan.id} className="p-3">
                            <div className="flex justify-between items-start mb-1">
                              <p className="text-xs font-medium text-brand-link">{pesan.dari}</p>
                              <span className="text-[10px] text-brand-muted flex-shrink-0 ml-2">
                                {new Date(pesan.createdAt).toLocaleDateString('id-ID')}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-brand-muted mb-1">{pesan.judul}</p>
                            <p className="text-sm text-brand-body">
                              {expandedPesanId === pesan.id ? pesan.isi : (
                                <span className="line-clamp-2">{pesan.isi}</span>
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-brand-muted">Belum ada pesan.</div>
                    )}
                  </div>
                </div>
              )}

              {/* Panduan */}
              <button
                onClick={() => { setIsPanduanOpen(true); setIsMobileMenuOpen(false); }}
                className="flex items-center w-full text-left px-4 py-2 text-brand-header hover:opacity-80"
              >
                <HelpCircle className="w-5 h-5 mr-3" />
                Panduan
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center w-full text-left px-4 py-2 text-red-300 hover:text-red-200"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-brand-surface border-b border-brand-surface">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide -mb-px">
            {[
              { id: 'ujian', label: 'Upload Ujian' },
              { id: 'kunci', label: 'Kunci Jawaban' },
              { id: 'siswa', label: 'Data Siswa' },
              { id: 'hasil', label: 'Hasil Ujian' },
              { id: 'donasi', label: '❤️ Donasi' },
              { id: 'qr', label: '📱 QR Aplikasi' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-3 px-2 sm:py-4 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'border-[var(--brand-link-hover)] text-[var(--brand-link-hover)]'
                    : 'border-transparent text-brand-muted hover:text-brand-heading hover:border-[var(--brand-link-hover)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Upload Ujian Tab */}
        {activeTab === 'ujian' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-brand-on-dark">Upload Ujian</h2>
              <Link
                href="/dashboard/guru/upload-ujian"
                className="btn-brand px-4 py-2 rounded-lg flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Upload Ujian Baru
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-brand-surface">
                <thead className="bg-brand-table-header">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-header uppercase tracking-wider">
                      Kode Ujian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-header uppercase tracking-wider">
                      Nama Ujian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-header uppercase tracking-wider">
                      Kelas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-header uppercase tracking-wider">
                      Jumlah Soal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-header uppercase tracking-wider">
                      Lama Ujian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-header uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-brand-surface">
                  {ujians.map((ujian) => (
                    <tr key={ujian.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-link">
                        {ujian.kodeUjian}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-link">
                        {ujian.namaUjian}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-link">
                        {ujian.kelas}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-link">
                        {ujian.jumlahSoal}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-link">
                        {ujian.lamaUjian} menit
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            href={`/dashboard/guru/edit-ujian/${ujian.id}`}
                            className="text-brand-link hover:text-brand-link-hover"
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
                  <FileText className="w-12 h-12 text-brand-muted mx-auto mb-4" />
                  <p className="text-brand-muted mb-4">Belum ada ujian yang diupload</p>
                  <p className="text-sm text-brand-muted">
                    Baru menggunakan aplikasi?{' '}
                    <button
                      onClick={() => setIsPanduanOpen(true)}
                      className="text-brand-link hover:text-brand-link-hover"
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
              <h2 className="text-2xl font-bold text-brand-on-dark">Kunci Jawaban</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => window.location.href = '/dashboard/guru/kunci-jawaban/upload'}
                  className="btn-brand px-4 py-2 rounded-lg flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Kunci Jawaban
                </button>
                <button
                  onClick={downloadKunciTemplate}
                  className="btn-brand px-4 py-2 rounded-lg flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-brand-surface">
                <thead className="bg-brand-table-header">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-header uppercase tracking-wider">
                      Kode Ujian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-header uppercase tracking-wider">
                      Nama Ujian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-header uppercase tracking-wider">
                      Kelas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-header uppercase tracking-wider">
                      Status Kunci
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-header uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-brand-surface">
                  {ujians.map((ujian) => {
                    const hasKunci = ujian.kunciJawaban && ujian.kunciJawaban !== '{}' && ujian.kunciJawaban !== 'null'
                    return (
                      <tr key={ujian.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-link">
                          {ujian.kodeUjian}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-link">
                          {ujian.namaUjian}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-link">
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
                              className="text-brand-link hover:text-brand-link-hover"
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
                  <FileText className="w-12 h-12 text-brand-muted mx-auto mb-4" />
                  <p className="text-brand-muted">Belum ada ujian yang diupload</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data Siswa Tab */}
        {activeTab === 'siswa' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-brand-on-dark">Data Siswa</h2>
              <Link
                href="/dashboard/guru/upload-siswa"
                className="btn-brand px-4 py-2 rounded-lg flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Upload Data Siswa
              </Link>
            </div>

            <div className="space-y-4">
              {Object.entries(siswaPerKelas).map(([kelas, siswaList]) => (
                <div key={kelas} className="bg-white rounded-lg shadow overflow-x-auto">
                  <div
                    className="btn-brand px-4 py-2 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleKelas(kelas)}
                  >
                    <div className="flex items-center">
                      {expandedKelas[kelas] ? (
                        <ChevronDown className="w-5 h-5 mr-2 text-brand-header" />
                      ) : (
                        <ChevronRight className="w-5 h-5 mr-2 text-brand-header" />
                      )}
                      <h3 className="text-lg font-semibold text-brand-header">Kelas {kelas}</h3>
                      <span className="ml-2 bg-brand-surface text-brand-link px-2 py-1 rounded-full text-xs">
                        {siswaList.length} siswa
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openTambahForm(kelas)
                        }}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Tambah Siswa
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSiswaPerKelas(kelas)
                        }}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-700 flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Hapus Kelas
                      </button>
                    </div>
                  </div>
                  
                  {expandedKelas[kelas] && (
                    <div className="divide-y divide-brand-surface">
                      {siswaList.map((siswa) => (
                        <div key={siswa.id} className="px-6 py-4 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-brand-heading">{siswa.nama}</p>
                            <p className="text-sm text-brand-body">NISN: {siswa.nisn}</p>
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
                <Users className="w-12 h-12 text-brand-on-dark mx-auto mb-4" />
                <p className="text-brand-on-dark">Belum ada data siswa</p>
              </div>
            )}
          </div>
        )}

        {/* === MODAL TAMBAH SISWA === */}
        {showTambahForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold text-brand-heading">Tambah Siswa</h3>
                  <p className="text-sm text-brand-body">Kelas: <span className="font-bold">{tambahKelas}</span></p>
                </div>
                <button
                  onClick={() => setShowTambahForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                {tambahRows.map((row, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5 text-center">{index + 1}</span>
                    <input
                      type="text"
                      placeholder="NISN"
                      value={row.nisn}
                      onChange={(e) => updateTambahRow(index, 'nisn', e.target.value)}
                      className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    />
                    <input
                      type="text"
                      placeholder="Nama Lengkap"
                      value={row.nama}
                      onChange={(e) => updateTambahRow(index, 'nama', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    />
                    {tambahRows.length > 1 && (
                      <button
                        onClick={() => removeTambahRow(index)}
                        className="text-red-400 hover:text-red-600 p-1 shrink-0"
                        title="Hapus baris"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {tambahError && (
                <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {tambahError}
                </div>
              )}

              {tambahSuccess && (
                <div className="mx-4 mb-2 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                  {tambahSuccess}
                </div>
              )}

              <div className="flex items-center justify-between p-4 border-t">
                <button
                  onClick={addTambahRow}
                  className="flex items-center px-3 py-2 rounded-lg text-sm font-semibold text-brand-link hover:opacity-80 border border-brand-surface"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Tambah Baris
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowTambahForm(false)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleTambahSiswa}
                    disabled={isSavingSiswa}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {isSavingSiswa ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hasil Ujian Tab */}
        {activeTab === 'hasil' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-brand-on-dark">Hasil Ujian</h2>
              <button 
                onClick={handleExportAll}
                className="btn-brand px-4 py-2 rounded-lg flex items-center">
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
                  className="btn-brand px-4 py-2 rounded-lg cursor-pointer"
                  onClick={() => toggleKelas(kelas)}
                  >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {expandedKelas[kelas] ? (
                        <ChevronDown className="w-5 h-5 text-brand-header mr-2" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-brand-header mr-2" />
                      )}
                      <h3 className="text-lg font-semibold text-brand-header">
                        Kelas {kelas}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span className="text-sm text-brand-header">
                        {hasilList.length} siswa
                      </span>
                      <div className="text-sm">
                        <span className="font-medium text-brand-header">
                          Rata-rata: 
                        </span>
                        <span className="ml-1 text-brand-header font-semibold">
                          {Math.round(hasilList.reduce((sum, h) => sum + h.skor, 0) / hasilList.length)}%
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteHasilPerKelas(kelas)
                        }}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-700 flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Hapus Kelas
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExportPerKelas(kelas, hasilList)
                        }}
                        className="btn-brand px-3 py-1 rounded text-sm flex items-center"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Export Kelas
                      </button>
                    </div>
                  </div>
                </div>
                {/* Detail Hasil per Kelas */}
                {expandedKelas[kelas] && (
                  <div className="mt-2 bg-white rounded-lg shadow overflow-x-auto">
                    <table className="min-w-full divide-y divide-brand-surface">
                      <thead className="bg-brand-table-header">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-brand-header uppercase tracking-wider">
                            Kode Ujian
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-brand-header uppercase tracking-wider">
                            Nama Siswa
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-brand-header uppercase tracking-wider">
                            NISN
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-brand-header uppercase tracking-wider">
                            Skor
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-brand-header uppercase tracking-wider">
                            Benar
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-brand-header uppercase tracking-wider">
                            Salah
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-brand-header uppercase tracking-wider">
                            Catatan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-brand-header uppercase tracking-wider">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-brand-surface">
                        {hasilList.map((hasil) => (
                          <tr key={hasil.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-link">
                              {hasil.ujian.kodeUjian}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-muted">
                              {hasil.siswa.nama}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-muted">
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-muted">
                              <span className="text-green-600 font-medium">
                                {hasil.benar}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-muted">
                              <span className="text-red-600 font-medium">
                                {hasil.salah}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              {hasil.appSwitchCount > 0 ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                  {hasil.appSwitchCount}x keluar
                                </span>
                              ) : (
                                <span className="text-xs text-brand-muted">Aman</span>
                              )}
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
                        <FileText className="w-8 h-8 text-brand-muted mx-auto mb-2" />
                        <p className="text-brand-muted text-sm">Belum ada hasil ujian untuk kelas ini</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Jika tidak ada hasil sama sekali */}
            {hasilUjians.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-brand-on-dark mx-auto mb-4" />
                <p className="text-brand-on-dark">Belum ada hasil ujian</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'donasi' && (
  <div className="p-6 bg-page-gradient-hover rounded-lg shadow-sm border border-brand-surface">
    <h2 className="text-center text-2xl font-bold text-brand-on-dark mb-1">
      ❤️ Jazakumullah khoiron katsiron
    </h2>
    <p className="text-sm text-brand-on-dark text-center mb-6">
      Terima kasih telah mendukung pengembangan aplikasi Ujian Pintar ini 🙏
    </p>

    <div className="space-y-3 max-w-md mx-auto">

      {/* BANK BJB */}
      <div className="bg-brand-surface border border-brand-surface rounded-lg p-3 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/images/bank-bjb.webp"
            alt="Bank BJB"
            className="h-8 w-16 object-contain flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="text-brand-link font-medium text-sm">0142842068100</p>
            <p className="text-xs text-brand-body">A.n: Ade Susandi, S.Pd</p>
          </div>
        </div>
        <button
          onClick={() => handleCopy("0142842068100")}
          className="text-brand-link hover:text-brand-link-hover flex-shrink-0"
        >
          <Copy className="w-5 h-5" />
        </button>
      </div>

      {/* BANK BRI */}
      <div className="bg-brand-surface border border-brand-surface rounded-lg p-3 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/images/bank-bri.webp"
            alt="Bank BRI"
            className="h-8 w-16 object-contain flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="text-brand-link font-medium text-sm">445601016460536</p>
            <p className="text-xs text-brand-body">A.n: Ade Susandi, S.Pd</p>
          </div>
        </div>
        <button
          onClick={() => handleCopy("445601016460536")}
          className="text-brand-link hover:text-brand-link-hover flex-shrink-0"
        >
          <Copy className="w-5 h-5" />
        </button>
      </div>

      {/* DANA */}
      <div className="bg-brand-surface border border-brand-surface rounded-lg p-3 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/images/dana.webp"
            alt="Dana"
            className="h-8 w-16 object-contain flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="text-brand-link font-medium text-sm">083895603395</p>
            <p className="text-xs text-brand-body">A.n: Ade Susandi, S.Pd</p>
          </div>
        </div>
        <button
          onClick={() => handleCopy("083895603395")}
          className="text-brand-link hover:text-brand-link-hover flex-shrink-0"
        >
          <Copy className="w-5 h-5" />
        </button>
      </div>
    </div>

    <p className="text-center text-[11px] text-brand-on-dark mt-6">
      Donasi Anda sangat berarti untuk keberlanjutan dan pengembangan fitur baru GTX Core.
    </p>
  </div>
)}

        {/* QR Aplikasi Tab */}
        {activeTab === 'qr' && (
  <div className="p-6 bg-page-gradient-hover rounded-lg shadow-sm border border-brand-surface text-center">
    <h2 className="text-2xl font-bold text-brand-on-dark mb-2">
      📱 QR Aplikasi SSC
    </h2>
    <p className="text-sm text-brand-on-dark mb-6">
      Scan QR code di bawah ini untuk mengakses aplikasi SSC dari HP Anda
    </p>
    <div className="flex justify-center">
      <img
        src="/qrssc.png"
        alt="QR Code SSC"
        className="w-56 h-56 sm:w-72 sm:h-72 object-contain rounded-lg"
      />
    </div>
    <p className="text-xs text-brand-on-dark mt-6">
      Arahkan kamera HP ke QR code di atas untuk membuka aplikasi
    </p>
  </div>
)}

      </main>

      {/* Modal Panduan Cepat */}
      {isPanduanOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-brand-link">Panduan Cepat Penggunaan Aplikasi</h2>
                <button
                  onClick={() => setIsPanduanOpen(false)}
                  className="text-brand-muted hover:text-brand-heading"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-brand-link mb-2">1. Upload Ujian (Real/Dummy)</h3>
                  <p className="text-brand-body text-sm">
                    Klik tab "Upload Ujian" lalu klik tombol "Upload Ujian Baru" untuk menambahkan soal ujian baru, 
                    Soal pdf bisa file apa saja untuk melakukan Dummy tidak harus lembar soal.
                    dan pastikan soal Real/Dumy format pdf.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-brand-link mb-2">2. Upload Data Siswa (Real/Dummy)</h3>
                  <p className="text-brand-body text-sm">
                    Klik tab "Data Siswa" lalu klik "Upload Data Siswa" untuk menambahkan data siswa.
                    Data siswa diperlukan untuk login dan penilaian, untuk format data siswa lihat Template. 
                    (Untuk Test Dummy nama dan No NISN bisa mengarang)
                    untuk ujian real NISN bisa di ganti dengan nomor apapun Syarat nomor Unik zero kemungkinan 
                    data yang sama antar siswa.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-brand-link mb-2">3. Melihat Hasil Ujian (Real/Dummy)</h3>
                  <p className="text-brand-body text-sm">
                    Klik tab "Hasil Ujian" untuk melihat hasil ujian siswa.
                    Anda dapat melihat hasil per kelas atau mengekspor semua hasil dalam format CSV.
                  </p>
                </div>
                
                <div className="bg-brand-surface p-4 rounded-lg">
                  <h3 className="font-semibold text-brand-heading mb-2">Tips Tambahan</h3>
                  <ul className="text-brand-body text-sm space-y-1 list-disc list-inside">
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
                  className="btn-brand px-4 py-2 rounded-lg"
                >
                  Mengerti
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isTulisPesanOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-header rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-brand-on-dark">Kirim Saran & Kritik</h2>
                <button
                  onClick={() => setIsTulisPesanOpen(false)}
                  className="text-brand-muted hover:text-brand-heading"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <textarea
                value={pesanContent}
                onChange={(e) => setPesanContent(e.target.value)}
                className="w-full p-3 border border-brand-surface rounded-lg focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent bg-white"
                rows={6}
                placeholder="Tuliskan saran atau kritik Anda di sini..."
              ></textarea>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => setIsTulisPesanOpen(false)}
                  className="px-4 py-2 text-brand-heading bg-brand-surface-hover rounded-lg hover:opacity-80"
                >
                  Batal
                </button>
                <button
                  onClick={handleTulisPesan}
                  disabled={isLoadingPesan}
                  className="btn-brand px-4 py-2 rounded-lg flex items-center disabled:opacity-50"
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