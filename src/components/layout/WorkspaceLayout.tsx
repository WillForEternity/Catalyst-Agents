'use client'

import { Button } from '@/components/ui/button'
import { FileExplorer } from '@/components/file-explorer/FileExplorer'
import { ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { useFileSystemStore } from '@/store/file-system-store'
import { useState, useEffect } from 'react'
import { useMindMapStore } from '@/store/mindmap-store'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/components/ui/use-toast'

interface WorkspaceLayoutProps {
  children: React.ReactNode
}

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const {
    isFileExplorerOpen,
    toggleFileExplorer,
    activeMindMapId,
    saveMindMap,
  } = useFileSystemStore()
  const { nodes, edges } = useMindMapStore()
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Auto-save mindmap every 30 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (activeMindMapId && nodes.length > 0) {
        handleSave(true)
      }
    }, 30000)

    return () => clearInterval(autoSaveInterval)
  }, [activeMindMapId, nodes, edges])

  const handleSave = async (isAutoSave = false) => {
    if (!activeMindMapId) return

    setIsSaving(true)
    try {
      await saveMindMap(activeMindMapId, nodes, edges)
      if (!isAutoSave) {
        toast({
          title: 'Mindmap saved',
          description: 'Your mindmap has been saved successfully.',
        })
      }
    } catch (error) {
      toast({
        title: 'Error saving mindmap',
        description: 'There was an error saving your mindmap.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex h-screen bg-muted/30 p-2">
      {/* File Explorer */}
      <div
        className={`h-full ${
          isFileExplorerOpen ? 'w-64' : 'w-0'
        } overflow-hidden transition-all duration-200 ease-in-out`}
      >
        <div className="h-full overflow-hidden rounded-lg">
          <FileExplorer />
        </div>
      </div>

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleFileExplorer}
        className="absolute left-2 top-1/2 z-10 h-12 w-6 -translate-y-1/2 rounded-l-none rounded-r-md border border-border bg-background shadow-md"
      >
        {isFileExplorerOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      {/* Main Content - with padding between file explorer and mindmap */}
      <div className="relative flex-1 pl-2">
        <div className="relative h-full">
          {/* Save Button - Positioned in the top-right corner of the mindmap */}
          {activeMindMapId && (
            <div className="absolute right-2 top-2 z-20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave()}
                disabled={isSaving}
                className="bg-background/80 shadow-md backdrop-blur-sm hover:bg-background"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}
