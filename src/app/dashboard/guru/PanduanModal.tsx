// src/app/dashboard/guru/PanduanModal.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface PanduanModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PanduanModal({ isOpen, onClose }: PanduanModalProps) {
  const [currentStep, setCurrentStep] = useState(0)

  // Daftar path gambar panduan
  const steps = [
    '/panduan-guru/step-1.webp',
    '/panduan-guru/step-2.webp',
    '/panduan-guru/step-3.webp',
  ]

  const nextStep = () => {
    setCurrentStep((prev) => (prev + 1) % steps.length)
  }

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length)
  }

  const goToStep = (index: number) => {
    setCurrentStep(index)
  }

  // Jika modal tidak dibuka, tidak render apa-apa
  if (!isOpen) return null

  return (
    // Overlay latar belakang gelap
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      {/* Konten Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header Modal dengan Tombol Tutup */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Panduan Cepat untuk Guru</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Area Gambar */}
        <div className="relative flex items-center justify-center bg-gray-50" style={{ height: '60vh' }}>
          <Image
            src={steps[currentStep]}
            alt={`Panduan langkah ${currentStep + 1}`}
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>

        {/* Navigasi dan Indikator */}
        <div className="p-4 bg-gray-100 border-t">
          <div className="flex justify-between items-center">
            {/* Tombol Sebelumnya */}
            <button
              onClick={prevStep}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Sebelumnya
            </button>

            {/* Indikator Titik */}
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToStep(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            {/* Tombol Selanjutnya */}
            <button
              onClick={nextStep}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentStep === steps.length - 1}
            >
              Selanjutnya
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}