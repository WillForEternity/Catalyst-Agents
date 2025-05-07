'use client'

import { useMindMapStore, NodeData } from '@/store/mindmap-store'
import { Button } from '@/components/ui/button'
import { Plus, Settings } from 'lucide-react'
import { ApiKeyManager } from '@/components/settings/ApiKeyManager'
import { v4 as uuidv4 } from 'uuid'
import { useState } from 'react'
import { Node } from '@xyflow/react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AgentConfigPopover } from './AgentConfigPopover'

export function Sidebar() {
  const { nodes, addNode, updateNodeData } = useMindMapStore()
  const [showApiKeys, setShowApiKeys] = useState(false)
  // No need for reactFlowInstance for now
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  // Find the selected node
  const selectedNode = nodes.find((node) => node.id === selectedNodeId)

  // Add a new agent node
  const handleAddNode = () => {
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
    setSelectedNodeId(newNode.id)
  }

  // Run the selected agent
  const handleRunAgent = async () => {
    if (!selectedNode || selectedNode.data.status === 'running') return

    updateNodeData(selectedNode.id, { status: 'running', output: '' })

    const messages = []
    if (selectedNode.data.input) {
      messages.push({ role: 'user', content: selectedNode.data.input })
    }

    try {
      const response = await fetch('/api/execute-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: selectedNode.data.provider,
          model: selectedNode.data.model,
          systemPrompt: selectedNode.data.prompt,
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
        updateNodeData(selectedNode.id, { output: accumulatedOutput })
      }

      updateNodeData(selectedNode.id, { status: 'completed' })
    } catch (error: any) {
      console.error('Failed to execute agent:', error)
      updateNodeData(selectedNode.id, {
        status: 'error',
        output: error.message || 'An unexpected error occurred.',
      })
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
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
    <div className="flex h-full flex-col border-l border-border bg-card">
      <div className="border-b border-border p-4">
        <h3 className="font-medium">Mind Flow Controls</h3>
      </div>

      <div className="flex flex-col space-y-4 p-4">
        <Button
          onClick={handleAddNode}
          className="flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Agent Node
        </Button>

        <Button
          variant="outline"
          onClick={() => setShowApiKeys(!showApiKeys)}
          className="flex items-center justify-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Manage API Keys
        </Button>

        {showApiKeys && (
          <div className="rounded-md border border-border p-4">
            <ApiKeyManager />
          </div>
        )}
      </div>

      <Tabs defaultValue="nodes" className="flex-1">
        <div className="border-b border-border px-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="nodes">Nodes</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="nodes" className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="space-y-2 p-4">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className={`cursor-pointer rounded-md border p-3 transition-colors ${
                    selectedNodeId === node.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedNodeId(node.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-3 w-3 rounded-full ${getStatusColor(
                          node.data.status,
                        )}`}
                        title={`Status: ${node.data.status || 'idle'}`}
                      />
                      <span className="font-medium">{node.data.label}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>
                      {node.data.provider} / {node.data.model}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="output" className="flex-1 p-0">
          {selectedNode ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-3 w-3 rounded-full ${getStatusColor(
                        selectedNode.data.status,
                      )}`}
                      title={`Status: ${selectedNode.data.status || 'idle'}`}
                    />
                    <h3 className="font-medium">{selectedNode.data.label}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <AgentConfigPopover
                      nodeId={selectedNode.id}
                      data={selectedNode.data}
                    />
                    <Button
                      size="sm"
                      onClick={handleRunAgent}
                      disabled={selectedNode.data.status === 'running'}
                    >
                      Run
                    </Button>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Provider:</span>{' '}
                    {selectedNode.data.provider || 'Not set'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Model:</span>{' '}
                    {selectedNode.data.model || 'Not set'}
                  </p>
                  {selectedNode.data.prompt && (
                    <div>
                      <span className="text-muted-foreground">Prompt:</span>
                      <p className="mt-1 rounded-md bg-secondary/20 p-2 text-xs">
                        {selectedNode.data.prompt}
                      </p>
                    </div>
                  )}
                  {selectedNode.data.input && (
                    <div>
                      <span className="text-muted-foreground">Input:</span>
                      <p className="mt-1 rounded-md bg-secondary/20 p-2 text-xs">
                        {selectedNode.data.input}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                {selectedNode.data.output ? (
                  <div>
                    <h4 className="mb-2 font-medium">Output:</h4>
                    <pre className="whitespace-pre-wrap rounded-md bg-secondary/20 p-4 text-xs">
                      {selectedNode.data.output}
                    </pre>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No output available. Run the agent to see results.
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select a node to view its output
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
