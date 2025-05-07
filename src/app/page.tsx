'use client'

import ClientAuthButton from '@/components/ClientAuthButton'
import ThemeToggle from '@/components/ThemeToggle'

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

      <div className="flex w-full flex-1 items-center justify-center">
        <div className="max-w-md p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold">Mind Map Coming Soon</h2>
          <p className="mb-6">
            We&apos;re working on implementing the interactive mind map for AI
            agent workflows.
          </p>
          <p className="text-sm text-muted-foreground">
            This page will feature a React Flow canvas where you can create,
            connect, and configure AI agent nodes.
          </p>
        </div>
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
