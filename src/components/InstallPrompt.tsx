'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPopup, setShowPopup] = useState(false)

  useEffect(() => {
    // Cek sudah pernah dismiss atau sudah installed
    if (localStorage.getItem('installDismissed') || localStorage.getItem('appInstalled')) {
      return
    }

    // Tangkap event install dari browser
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPopup(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Deteksi jika sudah terinstall
    window.addEventListener('appinstalled', () => {
      localStorage.setItem('appInstalled', 'true')
      setShowPopup(false)
      setDeferredPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem('appInstalled', 'true')
    }
    setDeferredPrompt(null)
    setShowPopup(false)
  }

  const handleDismiss = () => {
    setShowPopup(false)
    localStorage.setItem('installDismissed', 'true')
  }

  if (!showPopup) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 sm:bottom-4 sm:left-4 sm:right-4 sm:bottom-auto p-3 sm:p-0">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 sm:max-w-sm sm:mx-0 mx-auto max-w-lg">
        <div className="flex items-start gap-3">
          {/* Ikon */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-900 rounded-xl p-2.5 shrink-0">
            <Download className="w-5 h-5 text-white" />
          </div>

          {/* Teks */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm">Install Upin</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Buka sebagai app untuk pengalaman ujian yang lebih baik & aman
            </p>

            {/* Tombol */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="bg-gradient-to-br from-blue-600 to-blue-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:from-blue-900 hover:to-blue-600 transition-colors"
              >
                Install Sekarang
              </button>
              <button
                onClick={handleDismiss}
                className="text-xs text-gray-400 px-2 py-2 hover:text-gray-600 transition-colors"
              >
                Nanti saja
              </button>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={handleDismiss}
            className="text-gray-300 hover:text-gray-500 shrink-0 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}