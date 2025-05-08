'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea' // Assuming Textarea is installed or will be
import { useMindMapStore, NodeData } from '@/store/mindmap-store'
import { Settings2 } from 'lucide-react' // Icon for the trigger button

interface AgentConfigPopoverProps {
  nodeId: string
  data: Partial<NodeData> // Allow partial data for initial setup
  wrappedUpdateNodeData?: (nodeId: string, data: Partial<NodeData>) => void
}

// Providers - consider moving to a shared constants file
const SUPPORTED_PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  // Add more providers as needed
]

// Basic model list - ideally, this would be dynamic based on provider
const MODEL_OPTIONS: { [key: string]: { value: string; label: string }[] } = {
  openai: [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ],
  anthropic: [
    { value: 'claude-2', label: 'Claude 2' },
    { value: 'claude-instant-1.2', label: 'Claude Instant 1.2' },
  ],
}

export function AgentConfigPopover({
  nodeId,
  data,
  wrappedUpdateNodeData,
}: AgentConfigPopoverProps) {
  // Only use the store's updateNodeData if wrappedUpdateNodeData isn't provided
  const { updateNodeData: storeUpdateNodeData } = useMindMapStore()

  // Use the wrapped function if provided, otherwise fall back to the store function
  const updateNodeData = wrappedUpdateNodeData || storeUpdateNodeData

  const [provider, setProvider] = useState(
    data.provider || SUPPORTED_PROVIDERS[0].value,
  )
  const [model, setModel] = useState(data.model || '')
  const [systemPrompt, setSystemPrompt] = useState(data.prompt || '')
  const [nodeInput, setNodeInput] = useState(data.input || '')
  const [currentModels, setCurrentModels] = useState(
    MODEL_OPTIONS[provider] || [],
  )
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Update available models when provider changes
    setCurrentModels(MODEL_OPTIONS[provider] || [])
    // If the current model is not in the new list, reset it (optional)
    if (!MODEL_OPTIONS[provider]?.find((m) => m.value === model)) {
      setModel(MODEL_OPTIONS[provider]?.[0]?.value || '')
    }
  }, [provider, model])

  // Update local state if node data changes externally (e.g. from store directly)
  useEffect(() => {
    setProvider(data.provider || SUPPORTED_PROVIDERS[0].value)
    setModel(data.model || '')
    setSystemPrompt(data.prompt || '')
    setNodeInput(data.input || '')
  }, [data])

  const handleSave = () => {
    updateNodeData(nodeId, {
      provider,
      model,
      prompt: systemPrompt,
      input: nodeInput,
    })
    setIsOpen(false) // Close popover on save
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Agent Configuration</h4>
            <p className="text-sm text-muted-foreground">
              Set the provider, model, and system prompt for this agent.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={provider}
                onValueChange={(value) => {
                  setProvider(value)
                  // Reset model when provider changes, or select first available
                  setModel(MODEL_OPTIONS[value]?.[0]?.value || '')
                }}
              >
                <SelectTrigger id="provider" className="col-span-2 h-8">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="model">Model</Label>
              <Select
                value={model}
                onValueChange={setModel}
                disabled={!currentModels.length}
              >
                <SelectTrigger id="model" className="col-span-2 h-8">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {currentModels.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                placeholder="e.g., You are a helpful assistant."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="h-24 resize-none"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nodeInput">Node Input</Label>
              <Textarea
                id="nodeInput"
                placeholder="Enter the input for this agent..."
                value={nodeInput}
                onChange={(e) => setNodeInput(e.target.value)}
                className="h-24 resize-none"
              />
            </div>
          </div>
          <Button onClick={handleSave}>Save Configuration</Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
