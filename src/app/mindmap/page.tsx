'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import MindMapCanvas from '@/components/mindmap/MindMapCanvas'
import MindMapProvider from '@/components/mindmap/MindMapProvider'

export default function MindMapPage() {
  const router = useRouter()

  const handleBack = useCallback(() => {
    router.push('/')
  }, [router])

  return (
    <div className="flex h-screen w-full flex-col">
      <div className="flex w-full flex-1 overflow-hidden">
        <div className="flex h-full w-full overflow-hidden">
          <MindMapProvider>
            <MindMapCanvas onBack={handleBack} />
          </MindMapProvider>
        </div>
      </div>
    </div>
  )
}
