'use client'

// ============================================================
// SIAP-Pro — Auth Store (Zustand)
// Manages session state client-side
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserPublic, UserRole } from '@/types'
import { MOCK_USERS, MOCK_CREDENTIALS } from '@/lib/mock-data'
import { isAdminRole } from '@/lib/utils'

interface AuthState {
  user: UserPublic | null
  isLoading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  clearError: () => void
}

/** Simple mock auth — replace with Supabase calls in production */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null })

        // Simulate network delay
        await new Promise(r => setTimeout(r, 600))

        const cred = MOCK_CREDENTIALS[username.trim().toLowerCase()]
        if (!cred || cred.password !== password) {
          set({
            isLoading: false,
            error: 'Nama pengguna atau kata sandi salah.',
          })
          return false
        }

        const fullUser = MOCK_USERS.find(u => u.id === cred.userId)
        if (!fullUser || !fullUser.aktif) {
          set({
            isLoading: false,
            error: 'Akun tidak aktif. Hubungi administrator.',
          })
          return false
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash: _, ...safeUser } = fullUser
        set({ user: safeUser, isLoading: false, error: null })
        return true
      },

      logout: () => {
        set({ user: null, error: null })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'siappro-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
)

// ------------------------------------------------------------------
// Selector Hooks
// ------------------------------------------------------------------

export const useUser = () => useAuthStore(s => s.user)
export const useIsLoggedIn = () => useAuthStore(s => s.user !== null)
export const useIsAdmin = () => useAuthStore(s => s.user ? isAdminRole(s.user.role) : false)
export const useUserRole = () => useAuthStore(s => s.user?.role ?? null)

// ------------------------------------------------------------------
// Role Guards
// ------------------------------------------------------------------

export function canAccess(userRole: UserRole | null, allowedRoles: UserRole[]): boolean {
  if (!userRole) return false
  return allowedRoles.includes(userRole)
}

export const ROLE_ROUTES: Record<string, UserRole[]> = {
  '/dashboard':    Object.values(UserRole),
  '/penugasan':    [UserRole.SUPER_ADMIN, UserRole.KABAG, UserRole.KASUBBAG],
  '/pelaporan':    [UserRole.PROTOKOL, UserRole.SUPER_ADMIN, UserRole.KABAG, UserRole.KASUBBAG],
  '/persidangan':  [UserRole.PERSIDANGAN, UserRole.SUPER_ADMIN, UserRole.KABAG, UserRole.KASUBBAG],
  '/dokumentasi':  [UserRole.HUMAS, UserRole.SUPER_ADMIN, UserRole.KABAG, UserRole.KASUBBAG],
  '/admin':        [UserRole.SUPER_ADMIN],
}
