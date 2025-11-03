'use client'

import Link from 'next/link'
import { BookOpen, Users, GraduationCap } from 'lucide-react'
import Image from 'next/image'


export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-300 to-blue-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-1">
    <div className="flex justify-center mb-1">
    <div className="flex flex-col items-center text-center">
    <Image
      src="/logo.svg"
      alt="GTXEduKids - Platform Ujian Online"
      width={300}   // lebar logo (px)
      height={200}  // tinggi logo (px)
      className="w-[300px] h-[200px] object-contain"
      priority // <-- TAMBAHKAN PROPS INI
    />
<p className="text-center text-2xl md:text-3xl font-semibold leading-snug">
  <span className="text-4xl md:text-2xl font-bold text-gray-200 mb-4">
    Sistem Ujian Online
  </span>
  <br />
  <span className="text-4xl md:text-2xl font-bold text-gray-200 mb-4">
    Berbasis Web Bentuk Soal Pilihan Ganda
  </span>
</p>
    </div>
    </div>
          <h1 className="text-4xl md:text-2xl font-bold text-gray-200 mb-4">
            Intelligent Evaluation Platform
          </h1>
         </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/login/guru" className="group">
            <div className="bg-blue-200 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-blue-100">
              <div className="flex items-center mb-4">
                <div className="bg-blue-600 p-3 rounded-xl mr-4">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Portal Guru</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Kelola ujian, upload soal PDF, atur kunci jawaban, dan pantau hasil siswa
              </p>
              <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
                Masuk sebagai Guru
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          <Link href="/login/siswa" className="group">
            <div className="bg-blue-200 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-green-100">
              <div className="flex items-center mb-4">
                <div className="bg-blue-600 p-3 rounded-xl mr-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Portal Siswa</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Kerjakan ujian online dengan PDF viewer dan lembar jawaban digital
              </p>
              <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
                Masuk sebagai Siswa
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        <div className="text-center mt-15 text-gray-200 text-sm">
          © 2018 GTX Core (Banjar) - By Ade Susandi, S.Pd
        </div>
      </div>
    </div>
  )
}
