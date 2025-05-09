'use client'

import { useMindMapStore, NodeData } from '@/store/mindmap-store'
import { Button } from '@/components/ui/button'
import { Settings, Trash2, Edit, Check } from 'lucide-react'
import { NodeTypeSelector } from './NodeTypeSelector'
import { ApiKeyManager } from '@/components/settings/ApiKeyManager'
import { v4 as uuidv4 } from 'uuid'
import { useState, useRef, useEffect, ChangeEvent } from 'react'
import { Node, NodeChange } from '@xyflow/react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AgentConfigPopover } from './AgentConfigPopover'
import { Input } from '@/components/ui/input'

interface SidebarProps {
  wrappedUpdateNodeData: (nodeId: string, data: Partial<NodeData>) => void
  wrappedAddNode: (node: Node<NodeData>) => void
  wrappedPropagateOutput: (sourceNodeId: string, output: string) => void
  wrappedOnNodesChange: (changes: NodeChange[]) => void
  selectedNodeId: string | null
  onSelectNode: (nodeId: string | null) => void
  activeTab: 'nodes' | 'output'
  onTabChange: (tab: 'nodes' | 'output') => void
}

export function Sidebar({
  wrappedUpdateNodeData,
  wrappedAddNode,
  wrappedPropagateOutput,
  wrappedOnNodesChange,
  selectedNodeId,
  onSelectNode,
  activeTab,
  onTabChange,
}: SidebarProps) {
  // Use the store only for reading state, not for updates
  const { nodes } = useMindMapStore()
  // Removed showApiKeys state as we're integrating ApiKeyManager directly
  // No need for reactFlowInstance for now
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

    wrappedAddNode(newNode)
    onSelectNode(newNode.id)
  }

  // Run the selected agent
  const handleRunAgent = async () => {
    if (!selectedNode || selectedNode.data.status === 'running') return

    wrappedUpdateNodeData(selectedNode.id, { status: 'running', output: '' })

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
        wrappedUpdateNodeData(selectedNode.id, { output: accumulatedOutput })
      }

      wrappedUpdateNodeData(selectedNode.id, { status: 'completed' })

      // Propagate the output to connected nodes
      wrappedPropagateOutput(selectedNode.id, accumulatedOutput)
    } catch (error: any) {
      console.error('Failed to execute agent:', error)
      wrappedUpdateNodeData(selectedNode.id, {
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
    wrappedOnNodesChange([{ type: 'remove', id: nodeId }])
    if (selectedNodeId === nodeId) {
      onSelectNode(null)
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
      wrappedUpdateNodeData(editingNodeId, { label: editingNodeName.trim() })
      setEditingNodeId(null)
      setEditingNodeName('')
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-transparent">
      <div className="flex flex-col space-y-4 p-4">
        <NodeTypeSelector />

        <ApiKeyManager />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value: string) =>
          onTabChange(value as 'nodes' | 'output')
        }
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="px-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="nodes"
              className="bg-card/30 text-muted-foreground hover:bg-card/30"
            >
              Nodes
            </TabsTrigger>
            <TabsTrigger
              value="output"
              className="bg-card/40 text-muted-foreground hover:bg-card/30"
            >
              Output
            </TabsTrigger>
          </TabsList>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="px-4 pt-6">
            <TabsContent value="nodes">
              <h3 className="mb-2 text-sm font-medium">Created Nodes</h3>
            </TabsContent>
            <TabsContent value="output">
              <h3 className="mb-2 text-sm font-medium">Selected Node</h3>
            </TabsContent>
            <Separator className="my-2" />
          </div>
          <ScrollArea className="flex-1 overflow-auto px-4 pb-4 pt-2">
            <TabsContent value="nodes">
              {nodes.length > 0 ? (
                <div className="space-y-2">
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
                          onClick={() => onSelectNode(node.id)}
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
                            <span className="font-medium">
                              {node.data.label}
                            </span>
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
              ) : (
                <div className="flex items-center justify-center p-4 text-muted-foreground">
                  <div>
                    <p>No nodes created</p>
                    <p className="mt-1 text-xs">
                      Use the "Add Node" button above to create a new node
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="output">
              {selectedNode ? (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-3 w-3 rounded-full ${getStatusColor(
                          selectedNode.data.status,
                        )}`}
                        title={`Status: ${selectedNode.data.status || 'idle'}`}
                      />
                      <span className="font-medium">
                        {selectedNode.data.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AgentConfigPopover
                        nodeId={selectedNode.id}
                        data={selectedNode.data}
                        wrappedUpdateNodeData={wrappedUpdateNodeData}
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
                  <div className="mb-4 space-y-2 text-sm">
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
                  {selectedNode.data.output ? (
                    <>
                      <h4 className="mb-2 font-medium">Output:</h4>
                      <pre className="whitespace-pre-wrap rounded-md bg-secondary/20 p-4 text-xs">
                        {selectedNode.data.output}
                      </pre>
                    </>
                  ) : (
                    <div className="flex items-center justify-center text-muted-foreground">
                      No output available. Run the agent to see results.
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center p-4 text-muted-foreground">
                  <p>Select a node to view its output</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </div>
      </Tabs>
    </div>
  )
}
