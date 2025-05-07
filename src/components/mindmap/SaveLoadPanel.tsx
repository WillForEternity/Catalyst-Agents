'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useMindMapStore } from '@/store/mindmap-store'
import { Node, Edge } from '@xyflow/react'
import { NodeData } from '@/store/mindmap-store'

interface MindMap {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export default function SaveLoadPanel() {
  const [maps, setMaps] = useState<MindMap[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadingMap, setLoadingMap] = useState(false)
  const [projectName, setProjectName] = useState('Untitled Project')
  const [error, setError] = useState<string | null>(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [currentMapId, setCurrentMapId] = useState<string | null>(null)

  // Get the nodes and edges from the store
  const { nodes, edges, setNodes, setEdges } = useMindMapStore()

  // Create a Supabase client for browser
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Fetch saved mind maps
  useEffect(() => {
    const fetchMindMaps = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('mindmaps')
          .select('id, name, created_at, updated_at')
          .order('updated_at', { ascending: false })

        if (error) throw error

        setMaps(data || [])
      } catch (err: any) {
        console.error('Error fetching mind maps:', err)
        setError(err.message || 'Failed to fetch saved mind maps')
      } finally {
        setLoading(false)
      }
    }

    fetchMindMaps()
  }, [supabase])

  // Save the current mind map
  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      if (!projectName.trim()) {
        throw new Error('Project name is required')
      }

      const graph = { nodes, edges }

      if (currentMapId) {
        // Update existing mind map
        const { error } = await supabase
          .from('mindmaps')
          .update({
            name: projectName,
            graph,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentMapId)

        if (error) throw error
      } else {
        // Create new mind map
        const { data, error } = await supabase
          .from('mindmaps')
          .insert([
            {
              name: projectName,
              graph,
            },
          ])
          .select()

        if (error) throw error

        if (data && data[0]) {
          setCurrentMapId(data[0].id)
        }
      }

      // Refresh the list of mind maps
      const { data: updatedMaps, error: fetchError } = await supabase
        .from('mindmaps')
        .select('id, name, created_at, updated_at')
        .order('updated_at', { ascending: false })

      if (fetchError) throw fetchError

      setMaps(updatedMaps || [])
      setShowSaveDialog(false)
    } catch (err: any) {
      console.error('Error saving mind map:', err)
      setError(err.message || 'Failed to save mind map')
    } finally {
      setSaving(false)
    }
  }

  // Load a mind map
  const handleLoad = async (id: string) => {
    try {
      setLoadingMap(true)
      setError(null)

      const { data, error } = await supabase
        .from('mindmaps')
        .select('name, graph')
        .eq('id', id)
        .single()

      if (error) throw error

      if (data) {
        setProjectName(data.name)
        setCurrentMapId(id)

        // Set the nodes and edges in the store
        if (data.graph) {
          const { nodes, edges } = data.graph
          setNodes(nodes as Node<NodeData>[])
          setEdges(edges as Edge[])
        }
      }

      setShowLoadDialog(false)
    } catch (err: any) {
      console.error('Error loading mind map:', err)
      setError(err.message || 'Failed to load mind map')
    } finally {
      setLoadingMap(false)
    }
  }

  // Create a new mind map
  const handleNew = () => {
    setNodes([])
    setEdges([])
    setProjectName('Untitled Project')
    setCurrentMapId(null)
  }

  return (
    <div>
      {/* Main buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowSaveDialog(true)}
          className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Save
        </button>
        <button
          onClick={() => setShowLoadDialog(true)}
          className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent"
        >
          Load
        </button>
        <button
          onClick={handleNew}
          className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent"
        >
          New
        </button>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold">Save Mind Map</h2>

            {error && (
              <div className="mb-4 rounded border border-red-400 bg-red-100 p-3 text-red-700">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full rounded-md border border-border bg-background p-2"
                placeholder="Enter project name"
                disabled={saving}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold">Load Mind Map</h2>

            {error && (
              <div className="mb-4 rounded border border-red-400 bg-red-100 p-3 text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="py-8 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                <p className="mt-2 text-muted-foreground">
                  Loading saved mind maps...
                </p>
              </div>
            ) : maps.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  No saved mind maps found.
                </p>
              </div>
            ) : (
              <div className="mb-4 max-h-64 overflow-y-auto">
                <ul className="divide-y divide-border">
                  {maps.map((map) => (
                    <li key={map.id} className="py-2">
                      <button
                        onClick={() => handleLoad(map.id)}
                        className="w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-accent"
                        disabled={loadingMap}
                      >
                        <div className="font-medium">{map.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Last updated:{' '}
                          {new Date(map.updated_at).toLocaleString()}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent"
                disabled={loadingMap}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
