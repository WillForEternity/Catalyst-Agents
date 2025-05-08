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
      <div className="w-full flex-1">
        <MindMapProvider>
          <MindMapCanvas onBack={handleBack} />
        </MindMapProvider>
      </div>
    </div>
  )
}
