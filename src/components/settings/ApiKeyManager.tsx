'use client'

import { useState, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
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
const SUPPORTED_PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google AI' },
  { value: 'cohere', label: 'Cohere' },
]

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
  const [savedKeys, setSavedKeys] = useState<
    { provider: string; hasKey: boolean }[]
  >([])

  // Fetch saved keys on component mount
  const fetchSavedKeys = async () => {
    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'GET',
      })

      if (response.ok) {
        const result = await response.json()
        setSavedKeys(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch saved API keys:', error)
    }
  }

  // Load saved keys when dialog opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      fetchSavedKeys()
    }
  }

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

        // Update the saved keys list
        fetchSavedKeys()
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
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center justify-center gap-2 bg-card/40 text-muted-foreground hover:bg-card/50"
        >
          <Settings className="h-4 w-4" />
          Manage API Keys
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage API Keys</DialogTitle>
          <DialogDescription>
            Add and manage your API keys for LLM providers here. Your keys are
            stored securely and encrypted at rest.
          </DialogDescription>
        </DialogHeader>

        {/* Display saved keys */}
        {savedKeys.length > 0 && (
          <div className="mb-4">
            <h3 className="mb-2 text-sm font-medium">Saved API Keys:</h3>
            <div className="space-y-2">
              {savedKeys.map((key) => (
                <div
                  key={key.provider}
                  className="flex items-center justify-between rounded-md bg-secondary/20 p-2 text-sm"
                >
                  <span className="font-medium">
                    {key.provider.charAt(0).toUpperCase() +
                      key.provider.slice(1)}
                  </span>
                  <span className="text-xs text-green-500">✓ Saved</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
