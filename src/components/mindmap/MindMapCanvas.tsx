'use client'

import {
  ReactFlow,
  Background,
  Panel,
  MarkerType,
  NodeChange,
  EdgeChange,
  Connection,
} from '@xyflow/react'
import { useMindMapStore, NodeData } from '@/store/mindmap-store'
import { useFileSystemStore } from '@/store/file-system-store'
import { useState, useRef, useCallback, useEffect } from 'react'
import { Node } from '@xyflow/react'
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
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    updateNodeData,
    addNode,
    propagateOutput,
    setNodes,
    setEdges,
  } = useMindMapStore()

  const { activeMindMapId, saveMindMap, folders, createMindMap } =
    useFileSystemStore()
  const [saveStatus, setSaveStatus] = useState<
    'saved' | 'saving' | 'error' | null
  >(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

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

  // Function to save the current state with status updates
  const saveCurrentState = useCallback(async () => {
    if (nodes.length === 0) return

    // Ensure there's an active mindmap file
    let fileId = activeMindMapId
    if (!fileId) {
      fileId = await createMindMap('default', getActiveMindMapName())
    }

    setSaveStatus('saving')
    try {
      await saveMindMap(fileId, nodes, edges)
      setSaveStatus('saved')
      setLastSaved(new Date())
      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (error) {
      console.error('Auto-save failed:', error)
      setSaveStatus('error')
      // Reset error status after 5 seconds
      setTimeout(() => setSaveStatus(null), 5000)
    }
  }, [activeMindMapId, nodes, edges, saveMindMap, createMindMap])

  // Auto-save mindmap when changes are made to nodes or edges
  useEffect(() => {
    if (nodes.length === 0) return

    // Debounce save to avoid too many saves
    const debounceTimeout = setTimeout(() => {
      saveCurrentState()
    }, 1000) // Wait 1 second after changes before saving

    return () => {
      clearTimeout(debounceTimeout)
    }
  }, [nodes, edges, saveCurrentState])

  // Set up regular interval saves as a backup
  useEffect(() => {
    if (nodes.length === 0) return

    const autoSaveInterval = setInterval(() => {
      saveCurrentState()
    }, 30000) // Every 30 seconds

    return () => {
      clearInterval(autoSaveInterval)
    }
  }, [nodes, saveCurrentState])

  // Load nodes/edges from persisted mindmap into ReactFlow store
  useEffect(() => {
    if (!activeMindMapId || !folders.length) return
    const file = folders
      .flatMap((f) => f.files)
      .find((f) => f.id === activeMindMapId)
    if (file) {
      setNodes(file.nodes)
      setEdges(file.edges)
    }
  }, [activeMindMapId, folders, setNodes, setEdges])

  // Override the original store methods to ensure saves are triggered
  const wrappedOnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes)
      // The nodes state will update, which will trigger the useEffect above
    },
    [onNodesChange],
  )

  const wrappedOnEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes)
      // The edges state will update, which will trigger the useEffect above
    },
    [onEdgesChange],
  )

  const wrappedOnConnect = useCallback(
    (connection: Connection) => {
      onConnect(connection)
      // The edges state will update, which will trigger the useEffect above
    },
    [onConnect],
  )

  const wrappedUpdateNodeData = useCallback(
    (nodeId: string, data: Partial<NodeData>) => {
      updateNodeData(nodeId, data)
      // The nodes state will update, which will trigger the useEffect above
    },
    [updateNodeData],
  )

  const wrappedAddNode = useCallback(
    async (node: Node<NodeData>) => {
      // Ensure there's an active file to autosave into
      if (!activeMindMapId) {
        await createMindMap('default', getActiveMindMapName())
      }
      addNode(node)
      // The nodes state will update, which will trigger the useEffect autosave
    },
    [addNode, activeMindMapId, createMindMap],
  )

  const wrappedPropagateOutput = useCallback(
    (sourceNodeId: string, output: string) => {
      propagateOutput(sourceNodeId, output)
      // The nodes state will update, which will trigger the useEffect above
    },
    [propagateOutput],
  )

  return (
    <div ref={containerRef} className="relative flex h-full">
      <div
        className="overflow-hidden rounded-xl border border-border/30 bg-background/30 shadow-md"
        style={{ width: `calc(${leftPanelWidth}% - 4px)` }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={wrappedOnNodesChange}
          onEdgesChange={wrappedOnEdgesChange}
          onConnect={wrappedOnConnect}
          nodeTypes={nodeTypes}
          fitView
          className="h-full bg-background"
          snapToGrid={true}
          snapGrid={[15, 15]}
          defaultEdgeOptions={defaultEdgeOptions}
          proOptions={{ hideAttribution: true }} // Remove "powered by" labels
        >
          <Panel position="top-left" className="ml-2 mt-2 p-4">
            <h1 className="font-sans text-xl font-bold">
              {getActiveMindMapName()}
            </h1>
          </Panel>

          {/* Autosave Status - Positioned in the top-right corner of the mindmap */}
          {activeMindMapId && (
            <Panel position="top-right" className="mr-2 mt-2">
              <div className="flex items-center gap-1 rounded-md bg-background/80 px-2 py-1 text-xs shadow-sm backdrop-blur-sm">
                {saveStatus === 'saving' && (
                  <p className="animate-pulse text-muted-foreground">
                    Saving changes...
                  </p>
                )}
                {saveStatus === 'saved' && (
                  <p className="text-green-500">Changes saved</p>
                )}
                {saveStatus === 'error' && (
                  <p className="text-red-500">Error saving changes</p>
                )}
                {saveStatus === null && lastSaved && (
                  <p className="text-muted-foreground">
                    Autosaved at{' '}
                    {lastSaved.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </Panel>
          )}
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
        className="overflow-hidden rounded-xl border border-border/40 bg-card/40 shadow-md"
        style={{
          width: `calc(${100 - leftPanelWidth}% - 4px)`,
          marginLeft: '8px',
        }}
      >
        <Sidebar
          wrappedUpdateNodeData={wrappedUpdateNodeData}
          wrappedAddNode={wrappedAddNode}
          wrappedPropagateOutput={wrappedPropagateOutput}
          wrappedOnNodesChange={wrappedOnNodesChange}
        />
      </div>
    </div>
  )
}
