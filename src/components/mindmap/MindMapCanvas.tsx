'use client'

import { useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  Node,
} from '@xyflow/react'
import { useMindMapStore, NodeData } from '@/store/mindmap-store'
import { v4 as uuidv4 } from 'uuid'

// Import React Flow styles
import '@xyflow/react/dist/style.css'

// We'll define a simple custom node for now until we fix the AgentNode component
const CustomNode = ({ data }: { data: NodeData }) => (
  <div className="w-64 rounded-md border border-border bg-card p-4 shadow-md">
    <div className="-mx-4 -mt-4 mb-3 rounded-t-md bg-gradient-to-r from-[#57ecb2] to-[#50b6ff] p-2">
      <h3 className="font-medium text-white">{data.label}</h3>
    </div>
    <div className="text-xs">
      <p>
        <span className="text-muted-foreground">Provider:</span>{' '}
        {data.provider || 'Not set'}
      </p>
      <p>
        <span className="text-muted-foreground">Model:</span>{' '}
        {data.model || 'Not set'}
      </p>
      <p className="mt-2">
        <span className="text-muted-foreground">Status:</span>{' '}
        {data.status || 'idle'}
      </p>
    </div>
  </div>
)

// Register custom node types
const nodeTypes = {
  agent: CustomNode,
}

export default function MindMapCanvas() {
  // Use the Zustand store
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } =
    useMindMapStore()

  const reactFlowInstance = useReactFlow()

  // Add a new agent node
  const handleAddNode = useCallback(() => {
    // Use a simpler approach for positioning new nodes
    const position = {
      x: Math.random() * 300,
      y: Math.random() * 300,
    }

    const newNode = {
      id: `node-${uuidv4()}`,
      type: 'agent',
      position,
      data: {
        label: 'New Agent',
        provider: 'openai',
        model: 'gpt-4',
        prompt: '',
        status: 'idle',
      } as NodeData,
    }

    addNode(newNode)
  }, [addNode])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      className="bg-background"
    >
      <Background />
      <Controls />
      <MiniMap />
      <Panel position="top-right" className="rounded-md bg-card p-2 shadow-md">
        <button
          onClick={handleAddNode}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Add Agent Node
        </button>
      </Panel>
    </ReactFlow>
  )
}
