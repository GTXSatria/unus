'use client'

import React, { useEffect, useState } from 'react'

interface PdfViewerProps {
  pdfUrl: string | null
  token: string | null
  ujianData: any
}

export default function PdfViewer({ pdfUrl, token, ujianData }: PdfViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPdf = async () => {
      if (!pdfUrl || !token) {
        setError('PDF atau token tidak tersedia.')
        setLoading(false)
        return
      }

      try {
        const res = await fetch(pdfUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.message || 'Gagal mengambil PDF dari server')
        }

        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        setBlobUrl(url)
      } catch (err: any) {
        console.error('Error mengambil PDF:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPdf()

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [pdfUrl, token])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Memuat soal dari server...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-600">
        Gagal memuat PDF: {error}
      </div>
    )
  }

  if (!blobUrl) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        PDF tidak ditemukan.
      </div>
    )
  }

return (
  <div className="w-full h-full flex">
<iframe
  src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=0`}
  className="pdf-viewer"
  title={ujianData?.namaUjian || 'Soal Ujian'}
/>
  </div>
)
}
