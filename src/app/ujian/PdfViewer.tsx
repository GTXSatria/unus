// src/app/ujian/PdfViewer.tsx
'use client'

import { useEffect, useState } from 'react'

interface PdfViewerProps {
  pdfUrl: string | null
  ujianData: any
}

export default function PdfViewer({
  pdfUrl,
  ujianData
}: PdfViewerProps) {

  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {

    let objectUrl: string | null = null
    async function loadPdf() {

      if (!pdfUrl) {
        setError('URL PDF tidak tersedia')
        setIsLoading(false)
        return
      }
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(pdfUrl, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store'
        })
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(
              'Sesi siswa habis. Silakan login ulang.'
            )
          }
          throw new Error(
            'Gagal mengambil file PDF'
          )
        }
        const blob = await response.blob()
        if (blob.type !== 'application/pdf') {
          throw new Error(
            'File yang diterima bukan PDF'
          )
        }
        objectUrl = URL.createObjectURL(blob)
        setBlobUrl(
          `${objectUrl}#toolbar=0&navpanes=0&scrollbar=1`
        )
        setIsLoading(false)
      } catch (err: any) {
        console.error(
          'PDF LOAD ERROR:',
          err
        )
        setError(
          err.message ||
          'PDF gagal dibuka'
        )
        setIsLoading(false)
      }
    }
    loadPdf()
    return () => {

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }

    }
  }, [pdfUrl])

  return (
    <div className="flex-1 bg-gray-100 relative w-full h-full">
      {
        isLoading && (
          <div className="
            absolute inset-0
            flex items-center justify-center
            bg-white z-10
          ">
            <div className="text-center">
              <div className="
                animate-spin
                rounded-full
                h-12
                w-12
                border-b-2
                border-blue-600
                mx-auto
                mb-4
              " />

              <p>
                Memuat soal...
              </p>

            </div>

          </div>
        )
      }
      {
        error && (

          <div className="
            absolute inset-0
            flex items-center justify-center
            bg-white z-20
          ">
            <div className="text-center p-6">

              <h2 className="
                text-red-600
                font-bold
                text-lg
                mb-3
              ">
                Gagal Membuka Soal
              </h2>
              <p className="text-gray-600">
                {error}
              </p>
            </div>
          </div>

        )
      }
      {
        blobUrl && (

          <iframe
            src={blobUrl}
            className="
              w-full
              h-full
              border-0
            "
            title="Soal Ujian PDF"
          />

        )
      }
    </div>
  )
}