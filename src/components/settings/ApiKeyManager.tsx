'use client'

import { useState, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Supported providers - extend this as needed
const SUPPORTED_PROVIDERS = [{ value: 'openai', label: 'OpenAI' }]

export function ApiKeyManager() {
  const [isOpen, setIsOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [selectedProvider, setSelectedProvider] = useState(
    SUPPORTED_PROVIDERS[0].value,
  )
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleSaveKey = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider: selectedProvider, apiKey }),
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: result.message || 'API Key saved successfully!',
        })
        setApiKey('') // Clear input on success
        // Optionally close dialog after a delay
        // setTimeout(() => setIsOpen(false), 1500);
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to save API Key. Please try again.',
        })
      }
    } catch (error) {
      console.error('Failed to save API key:', error)
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred. Please check the console.',
      })
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Manage API Keys</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage API Keys</DialogTitle>
          <DialogDescription>
            Add and manage your API keys for LLM providers here. Your keys are
            stored securely.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="provider" className="text-right">
              Provider
            </Label>
            <Select
              value={selectedProvider}
              onValueChange={setSelectedProvider}
              disabled={isLoading}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_PROVIDERS.map((provider) => (
                  <SelectItem key={provider.value} value={provider.value}>
                    {provider.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="apiKey" className="text-right">
              API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setApiKey(e.target.value)
              }
              className="col-span-3"
              placeholder="Enter your API key"
              disabled={isLoading}
            />
          </div>
        </div>
        {message && (
          <p
            className={`text-sm ${
              message.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {message.text}
          </p>
        )}
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSaveKey}
            disabled={isLoading || !apiKey.trim()}
          >
            {isLoading ? 'Saving...' : 'Save Key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
