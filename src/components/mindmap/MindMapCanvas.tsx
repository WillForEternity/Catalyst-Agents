'use client'

import { ReactFlow, Background, Panel, MarkerType } from '@xyflow/react'
import { useMindMapStore } from '@/store/mindmap-store'
import { useFileSystemStore } from '@/store/file-system-store'
import { useState, useRef, useCallback, useEffect } from 'react'
import AgentNode from './AgentNode'
import { Sidebar } from './Sidebar'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'

// Import React Flow styles
import '@xyflow/react/dist/style.css'

// Register custom node types
const nodeTypes = {
  agent: AgentNode,
}

export default function MindMapCanvas() {
  // Use the Zustand stores
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } =
    useMindMapStore()

  const { activeMindMapId } = useFileSystemStore()

  // Define default edge options for animated dashed lines flowing right-to-left
  const defaultEdgeOptions = {
    animated: true,
    style: { strokeDasharray: '5 5' },
    pathOptions: { offset: 10 },
    markerEnd: {
      type: MarkerType.Arrow,
      color: 'var(--primary)',
      width: 20,
      height: 20,
    },
    // Reverse animation direction to flow right-to-left
    animationDirection: 'reverse',
  }

  // Find the active mindmap name
  const getActiveMindMapName = () => {
    if (!activeMindMapId) return 'Untitled Mindmap'

    const folders = useFileSystemStore.getState().folders
    for (const folder of folders) {
      const file = folder.files.find((file) => file.id === activeMindMapId)
      if (file) return file.name
    }

    return 'Untitled Mindmap'
  }

  const [leftPanelWidth, setLeftPanelWidth] = useState(75) // Default percentage width
  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  // Handle resize start
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingRef.current = true
    startXRef.current = e.clientX
    startWidthRef.current = leftPanelWidth
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Handle resize during drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return

    const containerWidth = containerRef.current.offsetWidth
    const deltaX = e.clientX - startXRef.current
    const deltaPercentage = (deltaX / containerWidth) * 100

    // Calculate new width with constraints (min 30%, max 85%)
    const newWidth = Math.min(
      Math.max(startWidthRef.current + deltaPercentage, 30),
      85,
    )
    setLeftPanelWidth(newWidth)

    // Update the resize handle position as we drag
    const handle = document.querySelector('.resize-handle') as HTMLElement
    if (handle) {
      handle.style.left = `calc(${newWidth}% - 4px)`
    }
  }, [])

  // Handle resize end
  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  // Clean up event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  return (
    <div ref={containerRef} className="relative flex h-full">
      <div
        className="overflow-hidden rounded-xl border border-border/50 bg-background shadow-md"
        style={{ width: `calc(${leftPanelWidth}% - 4px)` }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="h-full bg-background"
          snapToGrid={true}
          snapGrid={[15, 15]}
          defaultEdgeOptions={defaultEdgeOptions}
          proOptions={{ hideAttribution: true }} // Remove "powered by" labels
        >
          <Panel position="top-left" className="ml-2 mt-2 p-4">
            <h1 className="text-xl font-bold">{getActiveMindMapName()}</h1>
          </Panel>
          <Background />
        </ReactFlow>
      </div>

      {/* Custom resize handle that only appears on hover */}
      <div
        className="resize-handle group absolute z-10 cursor-col-resize"
        style={{
          left: `calc(${leftPanelWidth}% - 4px)`,
          top: '0',
          height: '100%',
          width: '8px',
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute left-1/2 top-1/2 h-64 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-transparent transition-colors group-hover:bg-primary"></div>
      </div>

      <div
        className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-md"
        style={{
          width: `calc(${100 - leftPanelWidth}% - 4px)`,
          marginLeft: '8px',
        }}
      >
        <Sidebar />
      </div>
    </div>
  )
}
