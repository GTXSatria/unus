// src/app/ujian/PdfViewer.tsx
'use client'

import { useState, useMemo } from 'react' // <-- IMPORT useMemo

interface PdfViewerProps {
  pdfUrl: string | null;
  ujianData: any;
}

export default function PdfViewer({ pdfUrl, ujianData }: PdfViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- KOREKSI 1: Stabilkan URL untuk mencegah berkedip ---
  // useMemo akan memastikan URL hanya dibuat sekali saat pdfUrl berubah,
  // bukan setiap kali komponen render.
  const finalPdfUrl = useMemo(() => {
    if (!pdfUrl) return null;
    // Tambahkan timestamp untuk cache busting dan #toolbar=0 untuk menyembunyikan toolbar browser
    return `${pdfUrl}?t=${Date.now()}#toolbar=0`;
  }, [pdfUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false)
    setError(null)
  }

  const handleIframeError = () => {
    setIsLoading(false)
    setError('Gagal memuat PDF. Pastikan koneksi internet stabil dan coba lagi.')
  }

  // Render tampilan loading atau error
  const renderOverlay = () => {
    if (error) {
      return (
        <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-10">
          <div className="text-center p-8">
            <svg className="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-semibold mb-2">Gagal Memuat Soal</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="block w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Refresh Halaman
            </button>
          </div>
        </div>
      )
    }

    if (isLoading) {
      return (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat soal...</p>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="flex-1 bg-gray-100 relative">
      {/* Overlay untuk Loading atau Error */}
      {renderOverlay()}
      
      {/* Iframe PDF - Gunakan URL yang sudah distabilkan */}
      {finalPdfUrl ? (
        <iframe
          src={finalPdfUrl} // <-- KOREKSI 2: Gunakan URL dari useMemo
          className="w-full h-full border-0"
          title="Soal Ujian PDF"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <p>URL Soal tidak tersedia.</p>
        </div>
      )}
    </div>
  )
}