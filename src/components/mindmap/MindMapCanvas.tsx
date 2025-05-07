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
import AgentNode from './AgentNode'
import { ApiKeyManager } from '@/components/settings/ApiKeyManager'

// Import React Flow styles
import '@xyflow/react/dist/style.css'

// Register custom node types
const nodeTypes = {
  agent: AgentNode,
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
        label: 'New Node',
        provider: 'openai',
        model: 'gpt-4',
        prompt: '',
        input: '',
        status: 'idle',
        output: '',
      } as NodeData,
    }

    addNode(newNode)
  }, [addNode])

  // Define default edge options for animated dashed lines
  const defaultEdgeOptions = {
    animated: true,
    style: { strokeDasharray: '5 5' },
  }

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
      snapToGrid={true}
      snapGrid={[15, 15]}
      defaultEdgeOptions={defaultEdgeOptions}
    >
      <Background />
      <Controls />
      <MiniMap />
      <Panel
        position="top-right"
        className="flex flex-col space-y-2 rounded-md bg-card p-2 shadow-md"
      >
        <button
          onClick={handleAddNode}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Add Agent Node
        </button>
        <ApiKeyManager />
      </Panel>
    </ReactFlow>
  )
}
