'use client'

import { Button } from '@/components/ui/button'
import { FileExplorer } from '@/components/file-explorer/FileExplorer'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useFileSystemStore } from '@/store/file-system-store'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/components/ui/use-toast'

interface WorkspaceLayoutProps {
  children: React.ReactNode
}

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const { isFileExplorerOpen, toggleFileExplorer } = useFileSystemStore()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

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
        <div className="relative h-full">{children}</div>
      </div>
    </div>
  )
}
