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
        return 'bg-yellow-500'
      case 'completed':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-400'
    }
  }

  return (
    <div className="w-64 rounded-md border border-border bg-card p-4 shadow-md">
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <div className="-mx-4 -mt-4 mb-3 flex items-center justify-between rounded-t-md bg-gradient-to-r from-[#57ecb2] to-[#50b6ff] p-2">
        <input
          type="text"
          value={nodeData.label}
          onChange={handleLabelChange}
          className="nodrag nopan bg-transparent text-sm font-medium text-white focus:outline-none"
        />
        <div
          className={`ml-2 h-3 w-3 rounded-full ${getStatusColor()}`}
          title={`Status: ${nodeData.status || 'idle'}`}
        />
      </div>
      <div className="text-xs">
        <p>
          <span className="text-muted-foreground">Provider:</span>{' '}
          {nodeData.provider || 'Not set'}
        </p>
        <p>
          <span className="text-muted-foreground">Model:</span>{' '}
          {nodeData.model || 'Not set'}
        </p>
        {nodeData.prompt && (
          <p className="mt-1 truncate" title={nodeData.prompt}>
            <span className="text-muted-foreground">Prompt:</span>{' '}
            {nodeData.prompt}
          </p>
        )}
        {nodeData.output && (
          <p className="mt-1 truncate" title={nodeData.output}>
            <span className="text-muted-foreground">Output:</span>{' '}
            {nodeData.output}
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
