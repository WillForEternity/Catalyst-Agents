'use client'

import { memo, ChangeEvent } from 'react'
import { Handle, Position, NodeProps, Node } from '@xyflow/react'
import {
  useMindMapStore,
  NodeData as StoreNodeData,
} from '@/store/mindmap-store'
import { AgentConfigPopover } from './AgentConfigPopover'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'

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

  const handleRunAgent = async () => {
    if (nodeData.status === 'running') return

    updateNodeData(id, { status: 'running', output: '' })

    const messages = []
    if (nodeData.input) {
      messages.push({ role: 'user', content: nodeData.input })
    }
    try {
      const response = await fetch('/api/execute-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: nodeData.provider,
          model: nodeData.model,
          systemPrompt: nodeData.prompt,
          messages: messages,
        }),
      })

      if (!response.ok) {
        const errorResult = await response.json()
        throw new Error(
          errorResult.error ||
            `API request failed with status ${response.status}`,
        )
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedOutput = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        accumulatedOutput += chunk
        updateNodeData(id, { output: accumulatedOutput })
      }

      updateNodeData(id, { status: 'completed' })
    } catch (error: any) {
      console.error('Failed to execute agent:', error)
      updateNodeData(id, {
        status: 'error',
        output: error.message || 'An unexpected error occurred.',
      })
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
          className="nodrag nopan flex-grow bg-transparent text-sm font-medium text-white focus:outline-none"
        />
        <div className="ml-2 flex items-center space-x-1">
          <div
            className={`h-3 w-3 rounded-full ${getStatusColor()}`}
            title={`Status: ${nodeData.status || 'idle'}`}
          />
          <AgentConfigPopover nodeId={id} data={nodeData} />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRunAgent}
            disabled={nodeData.status === 'running'}
            className="h-7 w-7 text-white hover:bg-white/20 hover:text-white"
          >
            <Play className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-1 text-xs">
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
        {nodeData.input && (
          <p className="mt-1 truncate" title={nodeData.input}>
            <span className="text-muted-foreground">Input:</span>{' '}
            {nodeData.input}
          </p>
        )}
        {nodeData.output && (
          <div className="mt-2">
            <span className="text-muted-foreground">Output:</span>
            <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded-md bg-secondary/20 p-2 text-xs">
              {nodeData.output}
            </pre>
          </div>
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
