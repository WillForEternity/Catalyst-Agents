'use client'

import { useCallback, useState } from 'react'
import NodeConfigPanel from './NodeConfigPanel'
import { toast } from 'sonner'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  Node,
  Edge,
  Connection,
  NodeTypes,
  EdgeTypes,
  NodeMouseHandler,
  NodeChange,
  EdgeChange,
  ConnectionLineType,
  MarkerType,
} from '@xyflow/react'
import { useMindMapStore, NodeData } from '@/store/mindmap-store'
import { v4 as uuidv4 } from 'uuid'

// Import React Flow styles
import '@xyflow/react/dist/style.css'

// Custom node component
const AgentNode = ({
  data,
  selected,
}: {
  data: NodeData
  selected: boolean
}) => (
  <div
    className={`border bg-card ${
      selected ? 'border-primary' : 'border-border'
    } w-64 rounded-md p-4 shadow-md`}
  >
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
      {data.prompt && (
        <div className="mt-2">
          <span className="text-muted-foreground">Prompt:</span>
          <div className="mt-1 max-h-20 overflow-y-auto rounded-md bg-muted p-2 text-xs">
            {data.prompt}
          </div>
        </div>
      )}
      {data.status && (
        <p className="mt-2">
          <span className="text-muted-foreground">Status:</span>{' '}
          <span
            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${
              data.status === 'completed'
                ? 'bg-green-100 text-green-800'
                : data.status === 'running'
                  ? 'bg-blue-100 text-blue-800'
                  : data.status === 'error'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
            }`}
          >
            {data.status}
          </span>
        </p>
      )}
    </div>
  </div>
)

// Register custom node types
const nodeTypes: NodeTypes = {
  agent: AgentNode,
}

// Custom edge style
const edgeOptions = {
  style: { stroke: '#50b6ff', strokeWidth: 2 },
  type: 'smoothstep',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#50b6ff',
  },
}

export default function MindMapCanvas() {
  // Use the Zustand store
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    updateNodeData,
  } = useMindMapStore()

  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  // Add a new agent node
  const handleAddNode = useCallback(() => {
    // Position the new node in the center of the viewport or with a slight offset from existing nodes
    const position = {
      x: 100 + Math.random() * 400,
      y: 100 + Math.random() * 200,
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

  // State for node configuration panel
  const [showConfigPanel, setShowConfigPanel] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)

  // Handle node click
  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedNode(node.id)
    setShowConfigPanel(true)
  }, [])

  // Connection settings
  const connectionLineStyle = { stroke: '#50b6ff', strokeWidth: 2 }

  // Function to execute the workflow
  const executeWorkflow = async (selectedNodes?: Node<NodeData>[]) => {
    // Declare nodesToExecute at the function level so it's available in the catch block
    let nodesToExecute: Node<NodeData>[] = []

    try {
      setIsExecuting(true)

      // If selectedNodes is provided, only execute those nodes
      // Otherwise, execute the entire workflow
      nodesToExecute = selectedNodes || nodes

      if (nodesToExecute.length === 0) {
        toast.error('No nodes to execute')
        return
      }

      // Update all nodes to 'idle' status first
      nodesToExecute.forEach((node: Node<NodeData>) => {
        if (!selectedNodes) {
          // Only reset all nodes when running the full workflow
          updateNodeData(node.id, { status: 'idle', output: undefined })
        }
      })

      // For selected nodes, set them to running
      nodesToExecute.forEach((node: Node<NodeData>) => {
        updateNodeData(node.id, { status: 'running' })
      })

      // Call the workflow execution API
      const response = await fetch('/api/run-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes: selectedNodes || nodes,
          edges,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to execute workflow')
      }

      const data = await response.json()

      // Update nodes with results
      if (data.results) {
        Object.entries(data.results).forEach(
          ([nodeId, result]: [string, any]) => {
            updateNodeData(nodeId, {
              status: result.status,
              output: result.output,
              error: result.error,
            })
          },
        )
      }

      toast.success('Workflow executed successfully')
    } catch (error: any) {
      console.error('Error executing workflow:', error)
      toast.error(
        error.message || 'An error occurred while executing the workflow',
      )

      // Update nodes to error state
      nodesToExecute.forEach((node: Node<NodeData>) => {
        updateNodeData(node.id, { status: 'error', error: error.message })
      })
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      defaultEdgeOptions={edgeOptions}
      connectionLineStyle={connectionLineStyle}
      connectionLineType={ConnectionLineType.SmoothStep}
      fitView
      className="bg-background"
    >
      <Background color="#aaa" gap={16} />
      <Controls />
      <MiniMap nodeStrokeWidth={3} zoomable pannable />
      <Panel position="top-right" className="rounded-md bg-card p-2 shadow-md">
        <div className="flex flex-col gap-2">
          <button
            onClick={handleAddNode}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Add Agent Node
          </button>
          {selectedNode && (
            <button
              onClick={() => {
                updateNodeData(selectedNode, { status: 'running' })
                // Call the API to execute just this node
                const selectedNodeObj = nodes.find(
                  (node) => node.id === selectedNode,
                )
                if (selectedNodeObj) {
                  executeWorkflow([selectedNodeObj])
                }
              }}
              className="rounded-md bg-secondary px-4 py-2 text-secondary-foreground transition-colors hover:bg-secondary/90"
              disabled={isExecuting}
            >
              Run Selected Node
            </button>
          )}
          <button
            onClick={() => executeWorkflow()}
            className="rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
            disabled={isExecuting || nodes.length === 0}
          >
            {isExecuting ? 'Executing...' : 'Run Workflow'}
          </button>
        </div>
      </Panel>

      {/* Node Configuration Panel */}
      {showConfigPanel && (
        <NodeConfigPanel
          nodeId={selectedNode}
          onClose={() => setShowConfigPanel(false)}
        />
      )}
    </ReactFlow>
  )
}
