import SideNav from '@/components/ui/SideNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <SideNav />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
