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

  // Color scheme inspired by the shared image with gradients
  const getNodeTypeStyles = () => {
    switch (nodeData.type) {
      case 'input':
        // futuristic green to lime gradient
        return 'from-[#2e7d32] to-[#cddc39]'
      case 'agent':
        // futuristic teal to cyan gradient
        return 'from-[#006d6b] to-[#4dd0e1]'
      case 'prompt':
        // futuristic turquoise to aqua gradient
        return 'from-[#00bfa6] to-[#80deea]'
      case 'conditional':
        // futuristic deep blue to electric blue gradient
        return 'from-[#1565c0] to-[#448aff]'
      case 'tool-call':
        // futuristic magenta to pink gradient
        return 'from-[#ad1457] to-[#f06292]'
      case 'output':
        // futuristic orange to amber gradient
        return 'from-[#ef6c00] to-[#ffd54f]'
      default:
        // default futuristic teal to cyan
        return 'from-[#006d6b] to-[#4dd0e1]'
    }
  }

  return (
    <div className="relative w-48 rounded-md border border-border bg-card shadow-md">
      {/* Only show target handle if not an input node */}
      {nodeData.type !== 'input' && (
        <Handle
          type="target"
          position={Position.Left}
          className="!left-[-8px] !h-3 !w-3 !border-2 !border-background !bg-primary"
          id={`target-${id}`}
        />
      )}
      <div
        className={cn(
          'flex items-center justify-between rounded-t-md bg-gradient-to-r p-2',
          getNodeTypeStyles(),
        )}
      >
        <span className="flex-grow text-sm font-medium text-white">
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
      {/* Only show source handle if not an output node */}
      {nodeData.type !== 'output' && (
        <Handle
          type="source"
          position={Position.Right}
          className="!right-[-8px] !h-3 !w-3 !border-2 !border-background !bg-primary"
          id={`source-${id}`}
        />
      )}
    </div>
  )
})

AgentNode.displayName = 'AgentNode'

export default AgentNode
