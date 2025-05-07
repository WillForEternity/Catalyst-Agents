'use client'

import { useState, useEffect } from 'react'
import { useMindMapStore, NodeData } from '@/store/mindmap-store'

interface NodeConfigPanelProps {
  nodeId: string | null
  onClose: () => void
}

export default function NodeConfigPanel({
  nodeId,
  onClose,
}: NodeConfigPanelProps) {
  const [nodeData, setNodeData] = useState<NodeData | null>(null)
  const [label, setLabel] = useState('')
  const [provider, setProvider] = useState('')
  const [model, setModel] = useState('')
  const [prompt, setPrompt] = useState('')

  const { nodes, updateNodeData } = useMindMapStore()

  // Load node data when nodeId changes
  useEffect(() => {
    if (!nodeId) {
      setNodeData(null)
      return
    }

    const node = nodes.find((n) => n.id === nodeId)
    if (node && node.data) {
      setNodeData(node.data)
      setLabel(node.data.label || '')
      setProvider(node.data.provider || '')
      setModel(node.data.model || '')
      setPrompt(node.data.prompt || '')
    }
  }, [nodeId, nodes])

  // Provider options
  const providerOptions = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'google', label: 'Google AI' },
    { value: 'mistral', label: 'Mistral AI' },
  ]

  // Model options based on provider
  const getModelOptions = (providerValue: string) => {
    switch (providerValue) {
      case 'openai':
        return [
          { value: 'gpt-4', label: 'GPT-4' },
          { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
        ]
      case 'anthropic':
        return [
          { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
          { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
          { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
        ]
      case 'google':
        return [
          { value: 'gemini-pro', label: 'Gemini Pro' },
          { value: 'gemini-ultra', label: 'Gemini Ultra' },
        ]
      case 'mistral':
        return [
          { value: 'mistral-large', label: 'Mistral Large' },
          { value: 'mistral-medium', label: 'Mistral Medium' },
          { value: 'mistral-small', label: 'Mistral Small' },
        ]
      default:
        return []
    }
  }

  // Handle save
  const handleSave = () => {
    if (!nodeId) return

    updateNodeData(nodeId, {
      label,
      provider,
      model,
      prompt,
    })

    onClose()
  }

  if (!nodeId || !nodeData) {
    return null
  }

  return (
    <div className="fixed right-0 top-0 z-50 h-full w-96 overflow-y-auto border-l border-border bg-card shadow-xl">
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Configure Agent Node</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 transition-colors hover:bg-accent"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Node Label */}
          <div>
            <label className="mb-1 block text-sm font-medium">Node Name</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-md border border-border bg-background p-2"
              placeholder="Enter node name"
            />
          </div>

          {/* Provider Selection */}
          <div>
            <label className="mb-1 block text-sm font-medium">Provider</label>
            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value)
                setModel('') // Reset model when provider changes
              }}
              className="w-full rounded-md border border-border bg-background p-2"
            >
              <option value="">Select a provider</option>
              {providerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Model Selection */}
          <div>
            <label className="mb-1 block text-sm font-medium">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-md border border-border bg-background p-2"
              disabled={!provider}
            >
              <option value="">Select a model</option>
              {getModelOptions(provider).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Prompt Template */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Prompt Template
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-32 w-full rounded-md border border-border bg-background p-2"
              placeholder="Enter your prompt template. Use {input} to reference output from connected nodes."
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Use {'{input}'} as a placeholder to include output from connected
              nodes.
            </p>
          </div>

          {/* Node Status (read-only) */}
          {nodeData.status && (
            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <div
                className={`rounded-md px-3 py-2 text-sm ${
                  nodeData.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : nodeData.status === 'running'
                      ? 'bg-blue-100 text-blue-800'
                      : nodeData.status === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                }`}
              >
                {nodeData.status}
              </div>
            </div>
          )}

          {/* Node Output (read-only) */}
          {nodeData.output && (
            <div>
              <label className="mb-1 block text-sm font-medium">Output</label>
              <div className="min-h-16 max-h-48 overflow-y-auto rounded-md border border-border bg-muted p-2">
                <pre className="whitespace-pre-wrap text-xs">
                  {nodeData.output}
                </pre>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={onClose}
              className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
