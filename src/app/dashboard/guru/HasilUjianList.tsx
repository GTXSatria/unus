'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Tipe data untuk hasil ujian
interface HasilUjian {
  id: string
  skor: number
  benar: number
  salah: number
  createdAt: string
  ujian: {
    id: string
    kodeUjian: string
    namaUjian: string
    kelas: string
  }
  siswa: {
    id: string
    nisn: string
    nama: string
    kelas: string
  }
}

export default function HasilUjianList() {
  const [hasilUjian, setHasilUjian] = useState<HasilUjian[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterKelas, setFilterKelas] = useState('')
  const [filterUjian, setFilterUjian] = useState('')
  const [kelasList, setKelasList] = useState<string[]>([])
  const [ujianList, setUjianList] = useState<{id: string, namaUjian: string}[]>([])
  const router = useRouter()

  // Fetch data hasil ujian
  useEffect(() => {
   console.log('Component mounted');
  fetchHasilUjian();
}, [filterKelas, filterUjian]);

  const fetchHasilUjian = async () => {
    try {
      console.log('=== FETCHING HASIL UJIAN ===')
      // console.log('Kelas list:', kelasList); // Di-comment
      // console.log('Ujian list:', ujianList); // Di-comment
      
      const token = localStorage.getItem('token')
      if (!token) {
        console.log('No token found, redirecting to login')
        router.push('/login/guru')
        return
      }

      // Build query string
      const queryParams = new URLSearchParams()
      if (filterKelas) queryParams.append('kelas', filterKelas)
      if (filterUjian) queryParams.append('ujian', filterUjian)
      
      const url = `/api/hasil-ujian${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      console.log('Fetching from URL:', url)

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Hasil ujian data received successfully.'); // Log aman
        // console.log('Data count:', data.length) // di koment
        
        setHasilUjian(data)
        
        // Extract unique kelas and ujian for filters
      const uniqueKelas = [...new Set(data.map((item: HasilUjian) => item.siswa.kelas))] as string[];
      const uniqueUjian = [...new Set(data.map((item: HasilUjian) => ({
      id: item.ujian.id,
      namaUjian: item.ujian.namaUjian
      })))] as { id: string, namaUjian: string }[];

        console.log('Kelas list:', uniqueKelas);
        console.log('Kelas list length:', uniqueKelas.length);

      setKelasList(uniqueKelas)
      setUjianList(uniqueUjian)
      
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        setError(errorData.message || 'Gagal mengambil data hasil ujian')
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setError('Terjadi kesalahan saat mengambil data')
    } finally {
      setLoading(false)
    }
  }

  // Fungsi untuk menghapus hasil ujian berdasarkan kelas
  const handleDeleteByKelas = async (kelas: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus semua hasil ujian di kelas ${kelas}?`)) {
      return
    }

    try {
      console.log(`=== DELETING HASIL UJIAN FOR KELAS: ${kelas} ===`)
      
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Token tidak ditemukan, silakan login kembali')
        return
      }

      const response = await fetch(`/api/hasil-ujian/kelas/${kelas}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('Delete response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Delete response:', data)
        alert(data.message)
        // Refresh daftar hasil ujian
        fetchHasilUjian()
      } else {
        const errorData = await response.json()
        console.error('Delete error:', errorData)
        alert(errorData.message || 'Gagal menghapus hasil ujian')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Terjadi kesalahan saat menghapus hasil ujian')
    }
  }

  // Fungsi untuk menghapus satu hasil ujian
  const handleDeleteHasilUjian = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus hasil ujian ini?')) {
      return
    }

    try {
      console.log(`=== DELETING HASIL UJIAN: ${id} ===`)
      
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Token tidak ditemukan, silakan login kembali')
        return
      }

      const response = await fetch(`/api/hasil-ujian/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('Delete response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Delete response:', data)
        alert(data.message)
        // Refresh daftar hasil ujian
        fetchHasilUjian()
      } else {
        const errorData = await response.json()
        console.error('Delete error:', errorData)
        alert(errorData.message || 'Gagal menghapus hasil ujian')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Terjadi kesalahan saat menghapus hasil ujian')
    }
  }

  // Fungsi untuk export data ke CSV
  const handleExportCSV = () => {
    console.log('=== EXPORTING TO CSV ===')
    
    // Create CSV content
    const headers = ['Nama Siswa', 'NISN', 'Kelas', 'Ujian', 'Skor', 'Benar', 'Salah', 'Tanggal']
    const rows = hasilUjian.map(item => [
      item.siswa.nama,
      item.siswa.nisn,
      item.siswa.kelas,
      item.ujian.namaUjian,
      item.skor.toString(),
      item.benar.toString(),
      item.salah.toString(),
      new Date(item.createdAt).toLocaleDateString()
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `hasil-ujian-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    console.log('CSV exported successfully')
  }

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  // Render error state
  if (error) {
    console.log('Rendering delete buttons for kelas:', kelasList);
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p className="font-bold">Error:</p>
        <p>{error}</p>
        <button 
          onClick={fetchHasilUjian}
          className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

return (
  <div className="container mx-auto p-4">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Hasil Ujian</h1>
      <button 
        onClick={handleExportCSV}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        disabled={hasilUjian.length === 0}
      >
        Export CSV
      </button>
    </div>
    
    {/* Filter Section */}
    <div className="bg-white p-4 rounded shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Filter Kelas
          </label>
          <select 
            value={filterKelas} 
            onChange={(e) => setFilterKelas(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Semua Kelas</option>
            {kelasList.map(kelas => (
              <option key={kelas} value={kelas}>{kelas}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Filter Ujian
          </label>
          <select 
            value={filterUjian} 
            onChange={(e) => setFilterUjian(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Semua Ujian</option>
            {ujianList.map(ujian => (
              <option key={ujian.id} value={ujian.id}>{ujian.namaUjian}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button 
          onClick={() => {
            setFilterKelas('')
            setFilterUjian('')
          }}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Reset Filter
        </button>
      </div>
    </div>
    
    {/* Results Section */}
    {hasilUjian.length === 0 ? (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <p className="font-bold">Tidak Ada Data</p>
        <p>Belum ada hasil ujian yang tersedia.</p>
      </div>
    ) : (
      <div className="bg-white rounded shadow overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-4 py-2 text-left">Nama Siswa</th>
                <th className="px-4 py-2 text-left">NISN</th>
                <th className="px-4 py-2 text-left">Kelas</th>
                <th className="px-4 py-2 text-left">Ujian</th>
                <th className="px-4 py-2 text-center">Skor</th>
                <th className="px-4 py-2 text-center">Benar</th>
                <th className="px-4 py-2 text-center">Salah</th>
                <th className="px-4 py-2 text-left">Tanggal</th>
                <th className="px-4 py-2 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {hasilUjian.map((hasil, index) => (
                <tr key={hasil.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 border-b">{hasil.siswa.nama}</td>
                  <td className="px-4 py-2 border-b">{hasil.siswa.nisn}</td>
                  <td className="px-4 py-2 border-b">{hasil.siswa.kelas}</td>
                  <td className="px-4 py-2 border-b">{hasil.ujian.namaUjian}</td>
                  <td className="px-4 py-2 border-b text-center">
                    <span className={`font-bold ${hasil.skor >= 70 ? 'text-green-600' : hasil.skor >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {hasil.skor}
                    </span>
                  </td>
                  <td className="px-4 py-2 border-b text-center">{hasil.benar}</td>
                  <td className="px-4 py-2 border-b text-center">{hasil.salah}</td>
                  <td className="px-4 py-2 border-b">
                    {new Date(hasil.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 border-b text-center">
                    <button 
                      onClick={() => handleDeleteHasilUjian(hasil.id)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
    
    {/* Delete by Kelas Section - Pastikan ini ada dan terlihat */}
    {kelasList.length > 0 && (
      <div className="mt-6 p-4 bg-gray-100 border border-gray-300 rounded-lg shadow-md">
  <h3 className="text-lg font-bold mb-4 text-red-600">Hapus Berdasarkan Kelas</h3>

  {kelasList.length === 0 ? (
    <p className="text-gray-500 text-sm italic">
      Tidak ada data kelas ditemukan. Pastikan API hasil ujian mengembalikan properti <code>siswa.kelas</code>.
    </p>
  ) : (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kelasList.map(kelas => (
        <button 
          key={kelas}
          onClick={() => handleDeleteByKelas(kelas)}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm transition-colors duration-200"
        >
          🗑️ Hapus Kelas {kelas}
        </button>
      ))}
    </div>
  )}
</div>
    )}
  </div>
)
}