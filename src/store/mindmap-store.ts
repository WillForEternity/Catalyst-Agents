import { create } from 'zustand'
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react'

// Define the node data interface as specified in the project guide
// Adding index signature to satisfy Record<string, unknown> constraint
export interface NodeData {
  label: string
  type: 'agent' | 'input' | 'output' | 'prompt' | 'conditional' | 'tool-call'
  provider?: 'openai' | 'anthropic' | string
  model?: string
  prompt?: string
  input?: string
  status?: 'idle' | 'running' | 'completed' | 'error'
  output?: string
  sourceNodeIds?: string[] // IDs of nodes that feed into this node
  targetNodeIds?: string[] // IDs of nodes that this node feeds into
  [key: string]: unknown
}

// Define the store state interface
export interface MindMapState {
  nodes: Node<NodeData>[]
  edges: Edge[]
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  addNode: (node: Node<NodeData>) => void
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void
  propagateOutput: (sourceNodeId: string, output: string) => void
  setNodes: (nodes: Node<NodeData>[]) => void
  setEdges: (edges: Edge[]) => void
}

// Create the Zustand store
export const useMindMapStore = create<MindMapState>((set, get) => ({
  nodes: [] as Node<NodeData>[],
  edges: [] as Edge[],

  // Handle node changes (position, selection, etc.)
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as Node<NodeData>[],
    })
  },

  // Handle edge changes
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges) as Edge[],
    })
  },

  // Handle connecting nodes with edges and update node awareness
  onConnect: (connection: Connection) => {
    const { source, target } = connection

    // Add the edge
    set({
      edges: addEdge(connection, get().edges),
    })

    // Update source and target nodes to be aware of their connections
    if (source && target) {
      const updatedNodes = get().nodes.map((node) => {
        if (node.id === source) {
          // Add target to source node's targetNodeIds
          return {
            ...node,
            data: {
              ...node.data,
              targetNodeIds: [...(node.data.targetNodeIds || []), target],
            },
          }
        }
        if (node.id === target) {
          // Add source to target node's sourceNodeIds
          return {
            ...node,
            data: {
              ...node.data,
              sourceNodeIds: [...(node.data.sourceNodeIds || []), source],
            },
          }
        }
        return node
      })

      set({ nodes: updatedNodes })
    }
  },

  // Add a new node
  addNode: (node: Node<NodeData>) => {
    set({
      nodes: [...get().nodes, node],
    })
  },

  // Update a node's data
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...data,
            },
          }
        }
        return node
      }),
    })
  },

  // Propagate output to connected nodes
  propagateOutput: (sourceNodeId: string, output: string) => {
    const sourceNode = get().nodes.find((node) => node.id === sourceNodeId)
    if (!sourceNode || !sourceNode.data.targetNodeIds?.length) return

    // Update all target nodes with the output as their input
    const targetNodeIds = sourceNode.data.targetNodeIds
    const updatedNodes = get().nodes.map((node) => {
      if (targetNodeIds.includes(node.id)) {
        return {
          ...node,
          data: {
            ...node.data,
            input: output,
          },
        }
      }
      return node
    })

    set({ nodes: updatedNodes })
  },

  // Set all nodes (e.g., when loading a saved mind map)
  setNodes: (nodes: Node<NodeData>[]) => {
    set({ nodes })
  },

  // Set all edges (e.g., when loading a saved mind map)
  setEdges: (edges: Edge[]) => {
    set({ edges })
  },
}))
