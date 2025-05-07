'use client'

import { memo, ChangeEvent } from 'react'
import { Handle, Position, NodeProps, Node } from '@xyflow/react'
import {
  useMindMapStore,
  NodeData as StoreNodeData,
} from '@/store/mindmap-store'

const AgentNode = memo(({ id, data }: NodeProps<Node<StoreNodeData>>) => {
  const { updateNodeData } = useMindMapStore()

  const nodeData = data

  const handleLabelChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateNodeData(id, { label: event.target.value })
  }

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

  return (
    <div className="w-48 rounded-md border border-border bg-card shadow-md">
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <div className="flex items-center justify-between rounded-t-md bg-gradient-to-r from-[#57ecb2] to-[#50b6ff] p-2">
        <input
          type="text"
          value={nodeData.label}
          onChange={handleLabelChange}
          className="nodrag nopan flex-grow bg-transparent text-sm font-medium text-white focus:outline-none"
        />
        <div
          className={`ml-2 h-3 w-3 rounded-full ${getStatusColor()}`}
          title={`Status: ${nodeData.status || 'idle'}`}
        />
      </div>
      <div className="p-2 text-xs text-muted-foreground">
        <p className="truncate">{nodeData.provider || 'Provider'}</p>
        <p className="truncate">{nodeData.model || 'Model'}</p>
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
