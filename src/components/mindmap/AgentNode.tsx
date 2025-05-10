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
        // subtle green gradient
        return 'from-[#a5d28e] to-[#b3d9a1]'
      case 'agent':
        // subtle teal gradient
        return 'from-[#4ba282] to-[#5bcf99]'
      case 'prompt':
        // subtle aqua gradient
        return 'from-[#3faf9b] to-[#5fd2ab]'
      case 'conditional':
        // subtle blue gradient
        return 'from-[#5290c5] to-[#6baedc]'
      case 'tool-call':
        // subtle magenta gradient
        return 'from-[#c24675] to-[#cc5880]'
      case 'output':
        // subtle orange gradient
        return 'from-[#d78b5f] to-[#e49d77]'
      default:
        // default subtle teal
        return 'from-[#4ba282] to-[#5bcf99]'
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
