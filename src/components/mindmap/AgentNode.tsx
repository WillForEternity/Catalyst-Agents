'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps, Node } from '@xyflow/react'
import {
  useMindMapStore,
  NodeData as StoreNodeData,
} from '@/store/mindmap-store'
import { cn } from '@/lib/utils'

const AgentNode = memo(({ id, data }: NodeProps<Node<StoreNodeData>>) => {
  const nodeData = data

  const getStatusColor = () => {
    switch (nodeData.status) {
      case 'running':
        return 'bg-yellow-500 animate-pulse'
      case 'completed':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-400'
    }
  }

  // Color scheme inspired by the shared image
  const getNodeTypeStyles = () => {
    switch (nodeData.type) {
      case 'input':
        return 'from-[#d7f9a9] to-[#d7f9a9]' // Light green
      case 'agent':
        return 'from-[#6dd3a6] to-[#6dd3a6]' // Medium green
      case 'prompt':
        return 'from-[#57cec3] to-[#57cec3]' // Teal
      case 'conditional':
        return 'from-[#5aa9e6] to-[#5aa9e6]' // Blue
      case 'tool-call':
        return 'from-[#e15a97] to-[#e15a97]' // Pink
      case 'output':
        return 'from-[#ff9e7d] to-[#ff9e7d]' // Orange (added as an extra color)
      default:
        return 'from-[#6dd3a6] to-[#6dd3a6]' // Default to medium green
    }
  }

  return (
    <div className="w-48 rounded-md border border-border bg-card shadow-md">
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <div
        className={cn(
          'flex items-center justify-between rounded-t-md bg-gradient-to-r p-2',
          getNodeTypeStyles(),
        )}
      >
        <span className="nodrag nopan flex-grow text-sm font-medium text-white">
          {nodeData.label}
        </span>
        <div
          className={`ml-2 h-3 w-3 rounded-full ${getStatusColor()}`}
          title={`Status: ${nodeData.status || 'idle'}`}
        />
      </div>
      <div className="p-2 text-xs text-muted-foreground">
        <p className="truncate font-semibold">
          {nodeData.type?.toUpperCase() || 'AGENT'}
        </p>
        {nodeData.type === 'agent' && (
          <>
            <p className="truncate">{nodeData.provider || 'Provider'}</p>
            <p className="truncate">{nodeData.model || 'Model'}</p>
          </>
        )}
        {nodeData.type === 'prompt' && (
          <p className="truncate">
            {nodeData.prompt
              ? `"${nodeData.prompt.substring(0, 20)}..."`
              : 'No prompt'}
          </p>
        )}
        {nodeData.type === 'conditional' && (
          <p className="truncate">
            Condition: {(nodeData.condition as string) || 'None'}
          </p>
        )}
        {nodeData.type === 'tool-call' && (
          <p className="truncate">
            Tool: {(nodeData.tool as string) || 'None'}
          </p>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary"
      />
    </div>
  )
})

AgentNode.displayName = 'AgentNode'

export default AgentNode
