'use client'

import { ReactFlow, Background } from '@xyflow/react'
import { useMindMapStore } from '@/store/mindmap-store'
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

// We keep the interface but make the prop optional since we're not using it
interface MindMapCanvasProps {
  onBack?: () => void
}

export default function MindMapCanvas({}: MindMapCanvasProps) {
  // Use the Zustand store
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } =
    useMindMapStore()

  // Define default edge options for animated dashed lines
  const defaultEdgeOptions = {
    animated: true,
    style: { strokeDasharray: '5 5' },
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel defaultSize={75} minSize={30}>
        <div className="relative h-full w-full">
          <div className="absolute left-4 top-4 z-10">
            <h1 className="text-xl font-bold">Catalyst Agents</h1>
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-background"
            snapToGrid={true}
            snapGrid={[15, 15]}
            defaultEdgeOptions={defaultEdgeOptions}
            proOptions={{ hideAttribution: true }} // Remove "powered by" labels
          >
            <Background />
          </ReactFlow>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={25} minSize={20}>
        <Sidebar />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
