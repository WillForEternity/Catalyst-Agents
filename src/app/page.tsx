'use client'

import ClientAuthButton from '@/components/ClientAuthButton'
import ThemeToggle from '@/components/ThemeToggle'
import MindMapCanvas from '@/components/mindmap/MindMapCanvas'
import SaveLoadPanel from '@/components/mindmap/SaveLoadPanel'
import ChatPanel from '@/components/chat/ChatPanel'
import { ReactFlowProvider } from '@xyflow/react'

export default function Home() {
  return (
    <div className="flex h-screen w-full flex-col bg-background">
      {/* Header */}
      <div className="z-10 flex h-16 w-full items-center justify-between border-b border-b-foreground/10 px-4">
        <div className="flex items-center gap-4">
          <h1 className="bg-gradient-to-r from-[#57ecb2] to-[#50b6ff] bg-clip-text text-xl font-bold text-transparent">
            Mind Flow
          </h1>
          <ClientAuthButton />
        </div>
        <div className="flex items-center gap-4">
          <button className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent">
            New Project
          </button>
          <a
            href="/settings"
            className="p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </a>
          <ThemeToggle />
        </div>
      </div>

      {/* Project Info Bar */}
      <div className="flex h-10 w-full items-center justify-between border-b border-b-foreground/10 bg-card/50 px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Project:</span>
          <span className="text-sm">Untitled Project</span>
          <button className="p-1 text-muted-foreground transition-colors hover:text-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">
            Last edited: Just now
          </span>
          <SaveLoadPanel />
        </div>
      </div>

      {/* Mind Map Canvas */}
      <div className="relative w-full flex-1">
        <ReactFlowProvider>
          <MindMapCanvas />
        </ReactFlowProvider>

        {/* Chat Panel */}
        <ChatPanel />
      </div>

      {/* Footer */}
      <footer className="w-full justify-center border-t border-t-foreground/10 p-2 text-center text-xs">
        <p>
          Powered by{' '}
          <a
            href="https://supabase.com"
            target="_blank"
            className="font-bold hover:underline"
            rel="noreferrer"
          >
            Supabase
          </a>
        </p>
      </footer>
    </div>
  )
}
