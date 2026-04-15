import AppShell from '@/components/ui/AppShell'
import { RoleProvider, ViewerBanner } from '@/components/providers/RoleProvider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleProvider>
      <AppShell>
        <ViewerBanner />
        {children}
      </AppShell>
    </RoleProvider>
  )
}
