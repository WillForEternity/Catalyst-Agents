'use client'

import { useState } from 'react'
import Link from 'next/link'
import ClientAuthButton from '@/components/ClientAuthButton'
import ThemeToggle from '@/components/ThemeToggle'
import ApiKeyManager from '@/components/settings/ApiKeyManager'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('api-keys')

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      {/* Header */}
      <div className="z-10 flex h-16 w-full items-center justify-between border-b border-b-foreground/10 px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="bg-gradient-to-r from-[#57ecb2] to-[#50b6ff] bg-clip-text text-xl font-bold text-transparent"
          >
            Mind Flow
          </Link>
          <ClientAuthButton />
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex w-full flex-1">
        {/* Sidebar */}
        <div className="w-64 border-r border-r-foreground/10 p-4">
          <h2 className="mb-4 text-lg font-medium">Settings</h2>
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('api-keys')}
              className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                activeTab === 'api-keys'
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'hover:bg-accent'
              }`}
            >
              API Keys
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                activeTab === 'account'
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'hover:bg-accent'
              }`}
            >
              Account
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                activeTab === 'appearance'
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'hover:bg-accent'
              }`}
            >
              Appearance
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'api-keys' && <ApiKeyManager />}

          {activeTab === 'account' && (
            <div className="p-6">
              <h2 className="mb-6 text-2xl font-bold">Account Settings</h2>
              <p className="text-muted-foreground">
                Account settings will be implemented in a future update.
              </p>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="p-6">
              <h2 className="mb-6 text-2xl font-bold">Appearance Settings</h2>
              <p className="text-muted-foreground">
                Appearance settings will be implemented in a future update.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
