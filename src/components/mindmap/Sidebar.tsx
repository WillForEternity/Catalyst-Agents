'use client'

import { useMindMapStore, NodeData } from '@/store/mindmap-store'
import { Button } from '@/components/ui/button'
import { Settings, Trash2, Edit, Check } from 'lucide-react'
import { NodeTypeSelector } from './NodeTypeSelector'
import { ApiKeyManager } from '@/components/settings/ApiKeyManager'
import { v4 as uuidv4 } from 'uuid'
import { useState, useRef, useEffect, ChangeEvent } from 'react'
import { Node } from '@xyflow/react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AgentConfigPopover } from './AgentConfigPopover'
import { Input } from '@/components/ui/input'

export function Sidebar() {
  const { nodes, addNode, updateNodeData, propagateOutput, onNodesChange } =
    useMindMapStore()
  // Removed showApiKeys state as we're integrating ApiKeyManager directly
  // No need for reactFlowInstance for now
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [editingNodeName, setEditingNodeName] = useState<string>('')
  const editInputRef = useRef<HTMLInputElement>(null)

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

      // Propagate the output to connected nodes
      propagateOutput(selectedNode.id, accumulatedOutput)
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

  // Delete a node
  const handleDeleteNode = (nodeId: string) => {
    onNodesChange([{ type: 'remove', id: nodeId }])
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null)
    }
  }

  // Start editing a node name
  const handleStartEditingNode = (nodeId: string, currentName: string) => {
    setEditingNodeId(nodeId)
    setEditingNodeName(currentName)
  }

  // Save the edited node name
  const handleSaveNodeName = () => {
    if (editingNodeId && editingNodeName.trim()) {
      updateNodeData(editingNodeId, { label: editingNodeName.trim() })
      setEditingNodeId(null)
    }
  }

  // Handle input change for node name editing
  const handleNodeNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditingNodeName(e.target.value)
  }

  // Handle pressing Enter to save the node name
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveNodeName()
    } else if (e.key === 'Escape') {
      setEditingNodeId(null)
    }
  }

  // Focus the input when editing starts
  useEffect(() => {
    if (editingNodeId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingNodeId])

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card">
      <div className="flex flex-col space-y-4 border-b border-border p-4">
        <NodeTypeSelector />

        <ApiKeyManager />
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
                  className={`rounded-md border p-3 transition-colors ${
                    selectedNodeId === node.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex flex-grow cursor-pointer items-center gap-2"
                      onClick={() => setSelectedNodeId(node.id)}
                    >
                      <div
                        className={`h-3 w-3 rounded-full ${getStatusColor(
                          node.data.status,
                        )}`}
                        title={`Status: ${node.data.status || 'idle'}`}
                      />
                      {editingNodeId === node.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            ref={editInputRef}
                            value={editingNodeName}
                            onChange={handleNodeNameChange}
                            onKeyDown={handleKeyDown}
                            className="h-6 py-0 text-sm"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={handleSaveNodeName}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="font-medium">{node.data.label}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          handleStartEditingNode(node.id, node.data.label)
                        }
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteNode(node.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>{node.data.type?.toUpperCase() || 'AGENT'}</p>
                    {node.data.type === 'agent' && (
                      <p>
                        {node.data.provider} / {node.data.model}
                      </p>
                    )}
                    {node.data.sourceNodeIds &&
                      node.data.sourceNodeIds.length > 0 && (
                        <p className="text-xs text-blue-500">
                          Inputs: {node.data.sourceNodeIds.length}
                        </p>
                      )}
                    {node.data.targetNodeIds &&
                      node.data.targetNodeIds.length > 0 && (
                        <p className="text-xs text-green-500">
                          Outputs: {node.data.targetNodeIds.length}
                        </p>
                      )}
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
