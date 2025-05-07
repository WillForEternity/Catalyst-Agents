'use client'

import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react'
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

export default function MindMapCanvas() {
  // Use the Zustand store
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } =
    useMindMapStore()

  // Define default edge options for animated dashed lines
  const defaultEdgeOptions = {
    animated: true,
    style: { strokeDasharray: '5 5' },
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg">
      <ResizablePanel defaultSize={75} minSize={30} className="rounded-l-lg">
        <div className="h-full w-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="rounded-l-lg bg-background"
            snapToGrid={true}
            snapGrid={[15, 15]}
            defaultEdgeOptions={defaultEdgeOptions}
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={25} minSize={20} className="rounded-r-lg">
        <Sidebar />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
