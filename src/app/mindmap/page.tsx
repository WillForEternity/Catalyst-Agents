'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function MindMapPage() {
  const router = useRouter()

  const handleBack = useCallback(() => {
    router.push('/')
  }, [router])

  return (
    <div className="flex h-screen w-full flex-col">
      <div className="flex h-16 w-full items-center justify-between border-b border-b-foreground/10 px-4">
        <button
          onClick={handleBack}
          className="flex items-center text-sm font-medium"
        >
          <span className="mr-2">←</span> Back to Home
        </button>
        <h1 className="text-xl font-bold">Mind Flow</h1>
        <div className="w-24"></div> {/* Spacer for balance */}
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
    </div>
  )
}
