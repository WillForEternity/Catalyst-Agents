'use client'

import ClientAuthButton from '@/components/ClientAuthButton'
import ThemeToggle from '@/components/ThemeToggle'
import MindMapProvider from '@/components/mindmap/MindMapProvider'
import MindMapCanvas from '@/components/mindmap/MindMapCanvas'

export default function Home() {
  return (
    <div className="flex h-screen w-full flex-col">
      <div className="flex h-16 w-full items-center justify-between border-b border-b-foreground/10 px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Mind Flow</h1>
          <ClientAuthButton />
        </div>
        <ThemeToggle />
      </div>

      <div className="w-full flex-1">
        <MindMapProvider>
          <MindMapCanvas />
        </MindMapProvider>
      </div>

      <footer className="w-full justify-center border-t border-t-foreground/10 p-4 text-center text-xs">
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
