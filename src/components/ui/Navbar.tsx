// src/components/ui/Navbar.tsx
'use client'

import { useAuth } from '@/hooks/useAuth' // <-- Import hook-nya

export default function Navbar() {
  const { logout } = useAuth() // <-- Gunakan hook-nya

  return (
    <nav className="... /* style navbar Anda */">
      {/* ... konten navbar lainnya */}
      <button onClick={logout} className="... /* style tombol logout */">
        Logout
      </button>
    </nav>
  )
}