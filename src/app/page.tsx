'use client'

import Link from 'next/link'
import { BookOpen, Users } from 'lucide-react'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen bg-page-gradient flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-1">
          <div className="flex justify-center mb-1">
            <div className="flex flex-col items-center text-center">
              <Image
                src="/ssc1.png"
                alt="Platform Ujian Online"
                width={250}
                height={200}
                className="w-[250px] h-[200px] object-contain"
                priority
              />
              <p className="text-center text-2xl md:text-3xl font-semibold leading-snug">
                <span className="text-4xl md:text-2xl font-bold text-brand-on-dark mb-4">
                  Kejujuran Adalah Nilai Sebenarnya
                </span>
                <br />
              </p>
            </div>
          </div>
          <h1 className="text-4xl md:text-2xl font-bold text-brand-on-dark mb-4">
            Future Education, Today
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/login/guru" className="group">
            <div className="bg-brand-surface bg-brand-surface-hover rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-brand-surface">
              <div className="flex items-center mb-4">
                <div className="bg-brand-icon p-3 rounded-xl mr-4">
                  <BookOpen className="w-8 h-8 text-brand-icon" />
                </div>
                <h2 className="text-2xl font-bold text-brand-heading">Portal Guru</h2>
              </div>
              <p className="text-brand-body mb-4">
                Kelola ujian, upload soal PDF, atur kunci jawaban, dan pantau hasil siswa
              </p>
              <div className="flex items-center text-brand-link text-brand-link-hover font-semibold">
                Masuk sebagai Guru
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          <Link href="/login/siswa" className="group">
            <div className="bg-brand-surface bg-brand-surface-hover rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-brand-surface">
              <div className="flex items-center mb-4">
                <div className="bg-brand-icon p-3 rounded-xl mr-4">
                  <Users className="w-8 h-8 text-brand-icon" />
                </div>
                <h2 className="text-2xl font-bold text-brand-heading">Portal Siswa</h2>
              </div>
              <p className="text-brand-body mb-4">
                Kerjakan ujian online dengan PDF viewer dan lembar jawaban digital
              </p>
              <div className="flex items-center text-brand-link text-brand-link-hover font-semibold">
                Masuk sebagai Siswa
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        <div className="text-center mt-15 text-brand-footer text-sm">
          © 2018 GTX Core (Banjar)
        </div>
      </div>
    </div>
  )
}