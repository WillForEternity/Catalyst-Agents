'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'

// A simplified node data interface to avoid TypeScript errors
interface SimpleNodeData {
  label: string
  provider?: string
  model?: string
  status?: string
}

const AgentNode = memo(({ id, data }: NodeProps) => {
  // Cast data to our simplified interface with safer approach
  const nodeData: SimpleNodeData = {
    label: (data as any)?.label || 'Agent',
    provider: (data as any)?.provider,
    model: (data as any)?.model,
    status: (data as any)?.status,
  }

  // Get status color based on node status
  const getStatusColor = () => {
    switch (nodeData.status) {
      case 'running':
        return 'bg-yellow-500'
      case 'completed':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-blue-500'
    }
  }

  return (
    <div className="w-64 rounded-md border border-border bg-card shadow-md">
      {/* Top connection handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="h-3 w-3 bg-blue-500"
      />

      {/* Header with gradient background */}
      <div className="rounded-t-md bg-gradient-to-r from-[#57ecb2] to-[#50b6ff] p-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-white">
            {nodeData.label || 'Agent'}
          </h3>
          <div className={`h-3 w-3 rounded-full ${getStatusColor()}`} />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-3">
        {/* Provider & Model */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Provider:</span>
            <span className="text-xs font-medium">
              {nodeData.provider || 'Not set'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Model:</span>
            <span className="text-xs font-medium">
              {nodeData.model || 'Not set'}
            </span>
          </div>
        </div>

        {/* Edit button */}
        <button className="mt-2 w-full rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground transition-colors hover:bg-secondary/90">
          Edit Configuration
        </button>
      </div>

      {/* Bottom connection handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="h-3 w-3 bg-blue-500"
      />
    </div>
  )
})

AgentNode.displayName = 'AgentNode'

export default AgentNode
