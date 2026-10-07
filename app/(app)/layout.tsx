// ============================================================
// SIAP-Pro: Dashboard Layout
// Dewan Ekonomi Nasional Republik Indonesia
// ============================================================

import AppLayout from '@/components/layout/AppLayout'
import { ReactNode } from 'react'

export default function DashboardGroupLayout({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>
}
