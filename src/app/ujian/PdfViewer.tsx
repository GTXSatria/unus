// src/app/ujian/PdfViewer.tsx

'use client'

import { useState } from 'react'

interface PdfViewerProps {
  pdfUrl: string | null
  ujianData: any
}

export default function PdfViewer({ pdfUrl }: PdfViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex-1 bg-gray-100 relative">

      {isLoading && !error && (
        <div className="absolute inset-0 bg-white z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              Memuat soal...
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-white z-10 flex items-center justify-center">
          <div className="text-center p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Gagal Memuat Soal
            </h3>

            <p className="text-gray-600 mb-4">
              {error}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-5 py-2 rounded"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {pdfUrl ? (
        <iframe
          src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
          className="w-full h-full border-0"
          title="Soal Ujian PDF"
          onLoad={() => {
            setIsLoading(false)
            setError(null)
          }}
          onError={() => {
            setIsLoading(false)
            setError('PDF tidak dapat dibuka')
          }}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-gray-500">
          URL Soal tidak tersedia
        </div>
      )}

    </div>
  )
}