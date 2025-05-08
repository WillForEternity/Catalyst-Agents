'use client'

import { useRouter } from 'next/navigation'
import ClientAuthButton from '@/components/ClientAuthButton'
import ThemeToggle from '@/components/ThemeToggle'
import MindMapProvider from '@/components/mindmap/MindMapProvider'
import MindMapCanvas from '@/components/mindmap/MindMapCanvas'

export default function Home() {
  const router = useRouter()

  const handleBack = () => {
    router.push('/')
  }
  return (
    <div className="flex h-screen w-full flex-col">
      <div className="flex h-16 w-full items-center justify-between border-b border-b-foreground/10 px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Catalyst Agents</h1>
          <ClientAuthButton />
        </div>
        <ThemeToggle />
      </div>

      <div className="w-full flex-1">
        <MindMapProvider>
          <MindMapCanvas onBack={handleBack} />
        </MindMapProvider>
      </div>

      {/* Footer removed */}
    </div>
  )
}
