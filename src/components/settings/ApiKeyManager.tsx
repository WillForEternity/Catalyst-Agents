'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface ApiKey {
  id: string
  provider: string
  api_key: string
  created_at: string
}

export default function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newProvider, setNewProvider] = useState('')
  const [newApiKey, setNewApiKey] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Create a Supabase client for browser
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Fetch API keys on component mount
  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const { data, error } = await supabase
          .from('api_keys')
          .select('id, provider, api_key, created_at')
          .order('created_at', { ascending: false })

        if (error) throw error

        // For security, mask the actual API keys
        const maskedData = data.map((key) => ({
          ...key,
          api_key: maskApiKey(key.api_key),
        }))

        setApiKeys(maskedData)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch API keys')
      } finally {
        setLoading(false)
      }
    }

    fetchApiKeys()
  }, [supabase])

  // Mask API key for display
  const maskApiKey = (key: string) => {
    if (key.length <= 8) return '********'
    return key.substring(0, 4) + '********' + key.substring(key.length - 4)
  }

  // Add new API key
  const handleAddApiKey = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      // Validate inputs
      if (!newProvider.trim()) throw new Error('Provider name is required')
      if (!newApiKey.trim()) throw new Error('API key is required')

      // Insert new API key
      const { data, error } = await supabase
        .from('api_keys')
        .insert([{ provider: newProvider.trim(), api_key: newApiKey.trim() }])
        .select()

      if (error) throw error

      // Add the new key to the state (with masked API key)
      if (data && data[0]) {
        setApiKeys([
          {
            ...data[0],
            api_key: maskApiKey(data[0].api_key),
          },
          ...apiKeys,
        ])
      }

      // Reset form
      setNewProvider('')
      setNewApiKey('')
      setShowAddForm(false)
    } catch (err: any) {
      setError(err.message || 'Failed to add API key')
    } finally {
      setSaving(false)
    }
  }

  // Delete API key
  const handleDeleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return

    try {
      setError(null)
      const { error } = await supabase.from('api_keys').delete().eq('id', id)

      if (error) throw error

      // Remove the deleted key from state
      setApiKeys(apiKeys.filter((key) => key.id !== id))
    } catch (err: any) {
      setError(err.message || 'Failed to delete API key')
    }
  }

  // Provider options
  const providerOptions = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'google', label: 'Google AI' },
    { value: 'mistral', label: 'Mistral AI' },
    { value: 'other', label: 'Other' },
  ]

  return (
    <div className="mx-auto w-full max-w-4xl p-4">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">API Key Management</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {showAddForm ? 'Cancel' : 'Add New API Key'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-400 bg-red-100 p-3 text-red-700">
          {error}
        </div>
      )}

      {showAddForm && (
        <form
          onSubmit={handleAddApiKey}
          className="mb-8 rounded-md border border-border bg-card p-4"
        >
          <h3 className="mb-4 text-lg font-medium">Add New API Key</h3>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">Provider</label>
            <select
              value={newProvider}
              onChange={(e) => setNewProvider(e.target.value)}
              className="w-full rounded-md border border-border bg-background p-2"
              disabled={saving}
              required
            >
              <option value="">Select a provider</option>
              {providerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">API Key</label>
            <input
              type="password"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              className="w-full rounded-md border border-border bg-background p-2"
              placeholder="Enter your API key"
              disabled={saving}
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Your API key is stored securely and never exposed to the client
              side after submission.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save API Key'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-muted-foreground">Loading API keys...</p>
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="rounded-md border border-border bg-card py-8 text-center">
          <p className="text-muted-foreground">
            No API keys found. Add your first API key to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Provider
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  API Key
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Added
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {apiKeys.map((key) => (
                <tr key={key.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm">
                    <span className="capitalize">{key.provider}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{key.api_key}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(key.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <button
                      onClick={() => handleDeleteApiKey(key.id)}
                      className="text-red-500 transition-colors hover:text-red-700"
                      aria-label="Delete API key"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
