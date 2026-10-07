'use client'

// ============================================================
// SIAP-Pro: App Shell Layout
// Dewan Ekonomi Nasional Republik Indonesia
// Desktop Sidebar + Mobile Responsive Navigation
// ============================================================

import { useEffect, ReactNode, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  FileText,
  Camera,
  Users,
  ScrollText,
  ListChecks,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { useAuthStore, useUser, useUserRole } from '@/store/auth-store'
import { UserRole } from '@/types'
import { getRoleLabel, cn, initials } from '@/lib/utils'

// ------------------------------------------------------------------
// Navigation Item Configuration
// ------------------------------------------------------------------
interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  roles: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: Object.values(UserRole),
  },
  {
    href: '/penugasan',
    label: 'Penugasan Acara',
    icon: CalendarDays,
    roles: [UserRole.SUPER_ADMIN, UserRole.KABAG, UserRole.KASUBBAG],
  },
  {
    href: '/pelaporan',
    label: 'Pelaporan Kegiatan',
    icon: ClipboardList,
    roles: [UserRole.PROTOKOL, UserRole.SUPER_ADMIN, UserRole.KABAG, UserRole.KASUBBAG],
  },
  {
    href: '/persidangan',
    label: 'Persidangan',
    icon: FileText,
    roles: [UserRole.PERSIDANGAN, UserRole.SUPER_ADMIN, UserRole.KABAG, UserRole.KASUBBAG],
  },
  {
    href: '/dokumentasi',
    label: 'Dokumentasi',
    icon: Camera,
    roles: [UserRole.HUMAS, UserRole.SUPER_ADMIN, UserRole.KABAG, UserRole.KASUBBAG],
  },
  {
    href: '/admin/users',
    label: 'Kelola Pengguna',
    icon: Users,
    roles: [UserRole.SUPER_ADMIN],
  },
  {
    href: '/admin/template',
    label: 'Template Checklist',
    icon: ListChecks,
    roles: [UserRole.SUPER_ADMIN],
  },
  {
    href: '/admin/audit-log',
    label: 'Log Audit Sistem',
    icon: ScrollText,
    roles: [UserRole.SUPER_ADMIN],
  },
]

// ------------------------------------------------------------------
// App Shell Layout
// ------------------------------------------------------------------
export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const user = useUser()
  const role = useUserRole()
  const { logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Auth guard
  useEffect(() => {
    if (!user) router.replace('/login')
  }, [user, router])

  if (!user || !role) return null

  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(role))

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  return (
    <div className="app-shell">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Institutional Sidebar (Desktop) */}
      <aside className={cn('sidebar', sidebarOpen && 'sidebar-open')}>
        <div className="sidebar-inner">
          {/* Official Agency Brand Header */}
          <div className="sidebar-logo">
            <div className="sidebar-logo-brand">
              <img
                src="/logo-den.svg"
                alt="Dewan Ekonomi Nasional"
                className="sidebar-logo-img w-full"
              />
            </div>

            <button
              className="sidebar-close-btn btn btn-ghost btn-icon lg-hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Tutup menu navigasi"
            >
              <X size={18} />
            </button>
          </div>

          <div className="sidebar-divider" />

          {/* Navigation Section */}

          <nav className="sidebar-nav" aria-label="Navigasi Kedinasan">
            {visibleNav.map(item => (
              <SidebarNavItem
                key={item.href}
                item={item}
                onClick={() => setSidebarOpen(false)}
              />
            ))}
          </nav>

          <div style={{ flex: 1 }} />

          <div className="sidebar-divider" />

          {/* Current Officer Profile Footer */}
          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="sidebar-avatar" aria-hidden="true">
                {initials(user.nama)}
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name" title={user.nama}>{user.nama}</span>
                <span className="sidebar-user-role">{getRoleLabel(user.role)}</span>
              </div>
            </div>
            <button
              id="btn-logout"
              className="btn btn-ghost btn-icon sidebar-logout"
              onClick={handleLogout}
              aria-label="Keluar dari sesi"
              title="Keluar dari sesi kedinasan"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Operational Stage */}
      <div className="app-main">
        {/* Mobile Header Bar */}
        <header className="mobile-header lg-hidden">
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka menu navigasi"
          >
            <Menu size={20} />
          </button>

          <div className="mobile-header-brand">
            <span className="mobile-header-title">SIAP-Pro</span>
            <span className="mobile-header-sub">DEN RI</span>
          </div>

          <div className="sidebar-avatar mobile-avatar" aria-hidden="true">
            {initials(user.nama)}
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="app-page-content">
          {children}
        </main>

        {/* Mobile Persistent Bottom Bar (min 44px tap target) */}
        <nav className="bottom-nav lg-hidden" aria-label="Navigasi Bawah">
          {visibleNav.slice(0, 5).map(item => (
            <BottomNavItem key={item.href} item={item} />
          ))}
        </nav>
      </div>

      <style>{appShellStyles}</style>
    </div>
  )
}

// ------------------------------------------------------------------
// Sidebar Nav Item Component
// ------------------------------------------------------------------
function SidebarNavItem({ item, onClick }: { item: NavItem; onClick: () => void }) {
  const pathname = usePathname()
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn('nav-item', isActive && 'active')}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon size={17} className="nav-icon" />
      <span className="nav-label">{item.label}</span>
      {isActive && <ChevronRight size={13} className="nav-arrow" />}
    </Link>
  )
}

// ------------------------------------------------------------------
// Mobile Bottom Bar Item Component
// ------------------------------------------------------------------
function BottomNavItem({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn('bottom-nav-item', isActive && 'active')}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon size={20} />
      <span>{item.label}</span>
    </Link>
  )
}

// ------------------------------------------------------------------
// Disciplined Scoped Layout Styles
// ------------------------------------------------------------------
const appShellStyles = `
  .app-shell {
    display: flex;
    min-height: 100dvh;
    background: var(--surface-canvas);
  }

  /* ---- Sidebar ---- */
  .sidebar {
    position: fixed;
    top: 0; left: 0; bottom: 0;
    width: var(--sidebar-width);
    z-index: 50;
    transform: translateX(-100%);
    transition: transform var(--transition-base);
    background: var(--surface-card);
    border-right: 1px solid var(--border-subtle);
    display: flex;
    flex-direction: column;
  }
  @media (min-width: 1024px) {
    .sidebar {
      transform: translateX(0);
      position: fixed;
    }
  }
  .sidebar-open { transform: translateX(0) !important; }

  .sidebar-overlay {
    position: fixed; inset: 0;
    background: rgba(15, 23, 42, 0.4);
    z-index: 49;
  }

  .sidebar-inner {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1.15rem 0.75rem;
    overflow-y: auto;
    gap: 0.35rem;
  }

  /* Official Brand Mark */
  .sidebar-logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.25rem 0.5rem;
  }
  .sidebar-logo-brand {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
  .sidebar-logo-img {
    height: 38px;
    width: auto;
    max-width: 120px;
    object-fit: contain;
  }
  .sidebar-logo-text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
  .sidebar-logo-name { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); line-height: 1.2; letter-spacing: -0.01em; }
  .sidebar-logo-sub  { font-size: 0.6875rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sidebar-close-btn { margin-left: auto; }

  .sidebar-divider {
    height: 1px;
    background: var(--border-subtle);
    margin: 0.5rem 0;
  }

  .sidebar-section-label {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    padding: 0.25rem 0.5rem 0.15rem 0.5rem;
  }

  /* Navigation Items */
  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .nav-label {
    flex: 1;
    font-size: 0.85rem;
  }
  .nav-arrow {
    color: var(--gold-500);
    opacity: 0.7;
  }

  /* Officer Profile Footer */
  .sidebar-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: var(--surface-canvas);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
  }
  .sidebar-user {
    display: flex; align-items: center; gap: 0.625rem;
    flex: 1; min-width: 0;
  }
  .sidebar-avatar {
    width: 32px; height: 32px;
    border-radius: var(--radius-sm);
    background: var(--surface-muted);
    border: 1px solid var(--border-distinct);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.725rem; font-weight: 600; color: var(--gold-500);
    flex-shrink: 0;
  }
  .sidebar-user-info {
    display: flex; flex-direction: column;
    min-width: 0;
    flex: 1;
  }
  .sidebar-user-name {
    font-size: 0.8125rem; font-weight: 600; color: var(--text-primary);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sidebar-user-role {
    font-size: 0.6875rem; color: var(--text-secondary);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sidebar-logout {
    color: var(--text-muted);
  }
  .sidebar-logout:hover {
    color: #dc2626;
    background: var(--status-red-bg);
  }

  /* ---- Main Stage ---- */
  .app-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    overflow: hidden;
  }
  @media (min-width: 1024px) {
    .app-main {
      margin-left: var(--sidebar-width);
    }
  }

  /* Mobile Top Bar */
  .mobile-header {
    position: sticky;
    top: 0; z-index: 40;
    height: 52px;
    background: var(--surface-card);
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0.875rem;
  }
  .mobile-header-brand {
    display: flex;
    align-items: baseline;
    gap: 0.35rem;
  }
  .mobile-header-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--gold-500);
  }
  .mobile-header-sub {
    font-size: 0.7rem;
    color: var(--text-muted);
  }
  .mobile-avatar {
    width: 28px; height: 28px;
    font-size: 0.65rem;
  }

  /* Page Content Container */
  .app-page-content {
    flex: 1;
    padding: 1.25rem 1rem;
    padding-bottom: calc(var(--nav-height-mobile) + 1.25rem);
    overflow-y: auto;
  }
  @media (min-width: 1024px) {
    .app-page-content {
      padding: 1.75rem 2rem;
      padding-bottom: 2rem;
    }
  }

  /* Mobile Bottom Navigation */
  .bottom-nav {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 40;
    height: var(--nav-height-mobile);
    background: var(--surface-card);
    border-top: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 0 0.25rem;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .bottom-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.15rem;
    padding: 0.4rem 0.5rem;
    border-radius: var(--radius-sm);
    color: var(--text-muted);
    font-size: 0.65rem;
    font-weight: 500;
    text-decoration: none;
    min-width: 48px;
    min-height: 44px; /* anti-slop R-03 touch target */
    -webkit-tap-highlight-color: transparent;
  }
  .bottom-nav-item.active {
    color: var(--gold-400);
  }

  .lg-hidden { display: flex; }
  @media (min-width: 1024px) { .lg-hidden { display: none !important; } }
`
