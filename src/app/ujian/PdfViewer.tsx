// src/app/ujian/PdfViewer.tsx
'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

interface PdfViewerProps {
  pdfUrl: string | null
  ujianData: any
  siswaData?: { nama: string; nisn: string; kelas: string } | null
}

export default function PdfViewer({ pdfUrl, ujianData, siswaData }: PdfViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [pdfjsReady, setPdfjsReady] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pdfDocRef = useRef<any>(null)

  useEffect(() => {
    if ((window as any).pdfjsLib) {
      setPdfjsReady(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.async = true
    script.onload = () => {
      ;(window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      setPdfjsReady(true)
    }
    script.onerror = () => {
      setError('Gagal memuat PDF reader. Periksa koneksi internet.')
      setIsLoading(false)
    }
    document.head.appendChild(script)
  }, [])

  const renderPage = useCallback(async (pdf: any, pageNum: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const page = await pdf.getPage(pageNum)
    const parentWidth = canvas.parentElement?.clientWidth || 595
    const defaultViewport = page.getViewport({ scale: 1 })
    const scale = parentWidth / defaultViewport.width
    const viewport = page.getViewport({ scale })

    const dpr = window.devicePixelRatio || 1
    canvas.width = viewport.width * dpr
    canvas.height = viewport.height * dpr
    canvas.style.width = `${viewport.width}px`
    canvas.style.height = `${viewport.height}px`
    ctx.scale(dpr, dpr)

    await page.render({
      canvasContext: ctx,
      viewport
    }).promise

    // ============================================================
    // WATERMARK: Nama + NISN + Kelas siswa
    // Diagonal berulang, semi-transparan merah
    // ============================================================
    if (siswaData?.nama) {
      ctx.save()
      ctx.font = `bold ${Math.max(12, 14 * scale)}px Arial`
      ctx.fillStyle = 'rgba(200, 0, 0, 0.1)'
      ctx.textAlign = 'center'

      const text = `${siswaData.nama} — ${siswaData.nisn} — ${siswaData.kelas}`
      const textWidth = ctx.measureText(text).width
      const stepX = textWidth + 60
      const stepY = Math.max(80, 100 * scale)

      ctx.translate(viewport.width / 2, viewport.height / 2)
      ctx.rotate((-25 * Math.PI) / 180)

      for (let y = -viewport.height * 1.5; y < viewport.height * 1.5; y += stepY) {
        for (let x = -viewport.width * 1.5; x < viewport.width * 1.5; x += stepX) {
          ctx.fillText(text, x, y)
        }
      }
      ctx.restore()
    }
  }, [siswaData])

  useEffect(() => {
    if (!pdfjsReady || !pdfUrl) return

    let cancelled = false

    async function loadAndRender() {
      try {
        setIsLoading(true)
        setError(null)

        const pdfjsLib = (window as any).pdfjsLib
        const response = await fetch(pdfUrl!, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store'
        })

        if (!response.ok) {
          if (response.status === 401) throw new Error('Sesi siswa habis. Silakan login ulang.')
          throw new Error('Gagal mengambil file PDF')
        }

        const arrayBuffer = await response.arrayBuffer()
        if (cancelled) return

        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
        pdfDocRef.current = pdf
        setNumPages(pdf.numPages)
        setPageNumber(1)

        if (cancelled) return

        await renderPage(pdf, 1)
        setIsLoading(false)
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'PDF gagal dibuka')
          setIsLoading(false)
        }
      }
    }

    loadAndRender()
    return () => { cancelled = true }
  }, [pdfjsReady, pdfUrl, renderPage])

  useEffect(() => {
    if (!pdfDocRef.current || numPages === 0) return
    renderPage(pdfDocRef.current, pageNumber)
  }, [pageNumber, numPages, renderPage])

  return (
    <div className="flex-1 bg-gray-100 relative w-full h-full flex flex-col">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p>Memuat soal...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-20 p-4">
          <div className="text-center">
            <h2 className="text-red-600 font-bold text-lg mb-3">Gagal Membuka Soal</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 h-0 overflow-auto flex flex-col items-start p-2 sm:p-4 bg-gray-200">
        <canvas
          ref={canvasRef}
          className="shadow-lg bg-white max-w-full h-auto"
        />
      </div>

      {numPages > 1 && (
        <div className="sticky bottom-0 left-0 right-0 bg-white shadow-md p-3 mt-4 flex justify-center items-center gap-4 z-30 rounded-t-lg">
          <button
            onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
            disabled={pageNumber <= 1}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
          >
            Sebelumnya
          </button>
          <span className="font-medium text-gray-700">
            Hal {pageNumber} / {numPages}
          </span>
          <button
            onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
            disabled={pageNumber >= numPages}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
          >
            Berikutnya
          </button>
        </div>
      )}
    </div>
  )
}