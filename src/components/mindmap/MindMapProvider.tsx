'use client'

import { ReactNode } from 'react'
import { ReactFlowProvider } from '@xyflow/react'

interface MindMapProviderProps {
  children: ReactNode
}

export default function MindMapProvider({ children }: MindMapProviderProps) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>
}
