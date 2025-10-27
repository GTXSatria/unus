// src/app/dashboard/admin/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, Send, Trash2, Users, FileText } from 'lucide-react'

interface Guru {
  id: string;
  name: string;
  email: string;
}

interface Pesan {
  id: string;
  dari: string;
  email?: string;
  judul: string;
  isi: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [pesanList, setPesanList] = useState<Pesan[]>([])
  const [guruList, setGuruList] = useState<Guru[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pesanContent, setPesanContent] = useState('')
  const [penerima, setPenerima] = useState('all')
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [pesanRes, guruRes] = await Promise.all([
        fetch('/api/admin/pesan'),
        fetch('/api/guru')
      ])

      if (pesanRes.ok) {
        const pesanData = await pesanRes.json()
        setPesanList(pesanData)
      }

      if (guruRes.ok) {
        const guruData = await guruRes.json()
        setGuruList(guruData)
      }
    } catch (error) {
      console.error('Gagal mengambil data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKirimPengumuman = async () => {
    if (!pesanContent.trim()) {
      alert('Isi pengumuman tidak boleh kosong.')
      return
    }
    setIsSending(true)
    try {
      const response = await fetch('/api/admin/pesan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isi: pesanContent, penerima }),
      })

      if (response.ok) {
        setPesanContent('')
        setPenerima('all')
        setIsModalOpen(false)
        fetchData() // Refresh daftar pesan
        alert('Pengumuman berhasil dikirim!')
      } else {
        alert('Gagal mengirim pengumuman.')
      }
    } catch (error) {
      console.error('Gagal mengirim pengumuman:', error)
      alert('Terjadi kesalahan saat mengirim pengumuman.')
    } finally {
      setIsSending(false)
    }
  }

  const handleHapusPesan = async (path: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pesan ini?')) return
    
    try {
      const response = await fetch(`/api/admin/pesan/${path}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchData() // Refresh daftar pesan
      } else {
        alert('Gagal menghapus pesan.')
      }
    } catch (error) {
      console.error('Gagal menghapus pesan:', error)
      alert('Terjadi kesalahan saat menghapus pesan.')
    }
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard/guru" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Kembali ke Dashboard Guru
              </Link>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard Admin</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tombol Kirim Pengumuman */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Pesan</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
          >
            <Mail className="w-4 h-4 mr-2" />
            Kirim Pengumuman Baru
          </button>
        </div>

        {/* Daftar Pesan */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dari</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judul</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Isi Pesan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pesanList.map((pesan) => (
                <tr key={pesan.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{pesan.dari}</p>
                      {pesan.email && <p className="text-xs text-gray-500">{pesan.email}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pesan.judul}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <p className="line-clamp-3">{pesan.isi}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(pesan.createdAt).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleHapusPesan(pesan.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pesanList.length === 0 && (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada pesan.</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal Kirim Pengumuman */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Kirim Pengumuman Baru</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <Trash2 className="w-5 h-5" /> {/* Menggunakan ikon X yang sudah ada */}
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Kepada</label>
                <select
                  value={penerima}
                  onChange={(e) => setPenerima(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Semua Guru</option>
                  {guruList.map((guru) => (
                    <option key={guru.id} value={guru.id}>
                      {guru.name} ({guru.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Isi Pengumuman</label>
                <textarea
                  value={pesanContent}
                  onChange={(e) => setPesanContent(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  rows={6}
                  placeholder="Tuliskan pengumuman Anda di sini..."
                ></textarea>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  onClick={handleKirimPengumuman}
                  disabled={isSending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
                >
                  {isSending ? 'Mengirim...' : 'Kirim'}
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