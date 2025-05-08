'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useMindMapStore, NodeData } from '@/store/mindmap-store'
import { v4 as uuidv4 } from 'uuid'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Node type definitions with icons, colors, and default configurations
// Color scheme inspired by the shared image
const nodeTypes = [
  {
    id: 'input',
    label: 'Input Node',
    description: 'Starting point for data',
    color: 'bg-[#d7f9a9]', // Light green
    defaultData: {
      type: 'input',
      provider: '',
      model: '',
      prompt: '',
      input: '',
      status: 'idle',
      output: '',
      sourceNodeIds: [],
      targetNodeIds: [],
    },
  },
  {
    id: 'agent',
    label: 'Agent Node',
    description: 'Process with AI model',
    color: 'bg-[#6dd3a6]', // Medium green
    defaultData: {
      type: 'agent',
      provider: 'openai',
      model: 'gpt-4',
      prompt: '',
      input: '',
      status: 'idle',
      output: '',
      sourceNodeIds: [],
      targetNodeIds: [],
    },
  },
  {
    id: 'prompt',
    label: 'Prompt Node',
    description: 'Custom system prompt',
    color: 'bg-[#57cec3]', // Teal
    defaultData: {
      type: 'prompt',
      provider: '',
      model: '',
      prompt: 'You are a helpful assistant.',
      input: '',
      status: 'idle',
      output: '',
      sourceNodeIds: [],
      targetNodeIds: [],
    },
  },
  {
    id: 'conditional',
    label: 'Conditional Node',
    description: 'Branch based on conditions',
    color: 'bg-[#5aa9e6]', // Blue
    defaultData: {
      type: 'conditional',
      provider: '',
      model: '',
      prompt: '',
      input: '',
      status: 'idle',
      output: '',
      condition: 'contains("yes")',
      sourceNodeIds: [],
      targetNodeIds: [],
    },
  },
  {
    id: 'tool-call',
    label: 'Tool Call Node',
    description: 'Execute external tools',
    color: 'bg-[#e15a97]', // Pink
    defaultData: {
      type: 'tool-call',
      provider: '',
      model: '',
      prompt: '',
      input: '',
      status: 'idle',
      output: '',
      tool: 'search',
      sourceNodeIds: [],
      targetNodeIds: [],
    },
  },
  {
    id: 'output',
    label: 'Output Node',
    description: 'Final result',
    color: 'bg-[#ff9e7d]', // Orange
    defaultData: {
      type: 'output',
      provider: '',
      model: '',
      prompt: '',
      input: '',
      status: 'idle',
      output: '',
      sourceNodeIds: [],
      targetNodeIds: [],
    },
  },
]

export function NodeTypeSelector() {
  const { addNode } = useMindMapStore()
  const [open, setOpen] = useState(false)

  const handleAddNode = (nodeType: string) => {
    // Find the node type configuration
    const typeConfig = nodeTypes.find((type) => type.id === nodeType)
    if (!typeConfig) return

    // Create a position with some randomness
    const position = {
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
    }

    // Create the new node with the appropriate type and default data
    const newNode = {
      id: `node-${uuidv4()}`,
      type: 'agent', // This is the React Flow node type, not our logical type
      position,
      data: {
        label: typeConfig.label,
        ...typeConfig.defaultData,
        sourceNodeIds: [],
        targetNodeIds: [],
      } as NodeData,
    }

    // Add the node to the store
    addNode(newNode)
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button className="flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" />
          Add Node
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {nodeTypes.map((type) => (
          <DropdownMenuItem
            key={type.id}
            onClick={() => handleAddNode(type.id)}
            className="flex flex-col items-start py-2"
          >
            <div className="flex w-full items-center">
              <div className={`mr-2 h-3 w-3 rounded-full ${type.color}`} />
              <span className="font-medium">{type.label}</span>
            </div>
            <span className="pl-5 text-xs text-muted-foreground">
              {type.description}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
