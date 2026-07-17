'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Eye, EyeOff, Mail, Lock, User, ArrowLeft } from 'lucide-react'

export default function RegisterGuru() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Password tidak cocok')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role: 'guru' }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/login/guru?message=Registrasi berhasil, silakan login')
      } else {
        setError(data.message || 'Registrasi gagal')
      }
    } catch (error) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-page-gradient flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-2">
          <Link href="/" className="inline-flex items-center justify-center mb-0">
            <div className="bg-brand-icon p-3 rounded-2xl shadow-lg">
              <BookOpen className="w-10 h-10 text-brand-icon" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-brand-on-dark mb-0">
            Daftar Guru
          </h1>
          <p className="text-brand-on-dark">
            Buat akun guru baru
          </p>
        </div>

        <div className="bg-brand-surface rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-brand-surface">
          <form onSubmit={handleRegister} className="space-y-1">
            <div>
              <label className="block text-sm font-medium text-brand-heading mb-0">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-brand-muted" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-brand-surface rounded-lg focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
                  placeholder="Nama lengkap"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-heading mb-0">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-brand-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-brand-surface rounded-lg focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-heading mb-0">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-brand-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-brand-surface rounded-lg focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-brand-muted hover:text-brand-heading"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-heading mb-0">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-brand-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-brand-surface rounded-lg focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
                  placeholder="Konfirmasi password"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-brand py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Mendaftar...' : 'Daftar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-brand-body">
              Sudah punya akun?{' '}
              <Link href="/login/guru" className="text-brand-link hover:text-brand-link-hover font-semibold text-brand-link-hover">
                Login di sini
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-brand-muted hover:text-brand-heading text-sm inline-flex items-center">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Kembali ke beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}