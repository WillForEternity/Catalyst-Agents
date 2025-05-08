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
      <div className="flex h-16 w-full items-center justify-between border-b border-b-foreground/10 px-4">
        <button
          onClick={handleBack}
          className="flex items-center text-sm font-medium"
        >
          <span className="mr-2">←</span> Back to Home
        </button>
        <h1 className="text-xl font-bold">Catalyst Agents</h1>
        <div className="w-24"></div> {/* Spacer for balance */}
      </div>

      <div className="flex w-full flex-1 overflow-hidden p-4">
        <div className="flex h-full w-full overflow-hidden rounded-lg border border-border">
          <MindMapProvider>
            <MindMapCanvas />
          </MindMapProvider>
        </div>
      </div>
    </div>
  )
}
