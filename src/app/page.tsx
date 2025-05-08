'use client'

import { useRouter } from 'next/navigation'
import MindMapProvider from '@/components/mindmap/MindMapProvider'
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout'
import MindMapCanvas from '@/components/mindmap/MindMapCanvas'
import { Toaster } from '@/components/ui/toaster'

export default function Home() {
  return (
    <div className="flex h-screen w-full flex-col">
      <MindMapProvider>
        <WorkspaceLayout>
          <MindMapCanvas />
        </WorkspaceLayout>
        <Toaster />
      </MindMapProvider>
    </div>
  )
}
