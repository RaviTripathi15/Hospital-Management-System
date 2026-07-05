import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useUIStore } from '@/store/uiStore'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { cn } from '@/utils/cn'

export default function MainLayout() {
  const { sidebarCollapsed } = useUIStore()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop: always visible, Mobile: drawer */}
      <div
        className={cn(
          'fixed lg:relative lg:flex flex-shrink-0 h-full z-40 lg:z-auto transition-transform duration-300',
          mobileSidebarOpen ? 'flex translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <Sidebar onClose={() => setMobileSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setMobileSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-[1600px] mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
