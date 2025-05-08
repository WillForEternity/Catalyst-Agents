'use client'

import { ReactNode, useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { useFileSystemStore } from '@/store/file-system-store'

interface MindMapProviderProps {
  children: ReactNode
}

export default function MindMapProvider({ children }: MindMapProviderProps) {
  // Load existing mindmaps on start so autosave can work with activeMindMapId
  const loadMindMaps = useFileSystemStore((state) => state.loadMindMaps)
  useEffect(() => {
    loadMindMaps()
  }, [loadMindMaps])

  return <ReactFlowProvider>{children}</ReactFlowProvider>
}
