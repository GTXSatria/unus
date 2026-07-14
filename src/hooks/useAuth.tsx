// src/hooks/useAuth.tsx
'use client'

import { useRouter } from 'next/navigation'

export function useAuth() {
  const router = useRouter()

  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      
      if (response.ok) {
        localStorage.clear()
        sessionStorage.clear()
        router.push('/login/guru')
      } else {
        console.error('Logout gagal')
      }
    } catch (error) {
      console.error('Terjadi kesalahan saat logout:', error)
    }
  }

  return { logout }
}