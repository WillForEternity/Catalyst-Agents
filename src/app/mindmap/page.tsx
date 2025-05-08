'use client'

import { useRouter } from 'next/navigation'
import MindMapCanvas from '@/components/mindmap/MindMapCanvas'
import MindMapProvider from '@/components/mindmap/MindMapProvider'
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout'
import { Toaster } from '@/components/ui/toaster'

export default function MindMapPage() {
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
