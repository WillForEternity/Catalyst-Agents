import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Error getting session:', sessionError)
      return NextResponse.json(
        { error: 'Failed to get session' },
        { status: 500 },
      )
    }

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { user } = session
    const { provider, apiKey } = await request.json()

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Provider and API key are required' },
        { status: 400 },
      )
    }

    // --- CRITICAL SECURITY NOTE ---
    // API keys MUST be encrypted at rest.
    // Consider using Supabase Vault with pgsodium for robust encryption.
    // For now, we are storing it directly, but this needs to be addressed.
    // Example of what to store if encrypted: encrypted_api_key, nonce, etc.
    // For now, we'll upsert the plaintext key which is NOT secure for production.

    const { data, error } = await supabase
      .from('api_keys')
      .upsert(
        {
          user_id: user.id,
          provider: provider,
          api_key: apiKey, // Store encrypted key here in a real application
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id, provider', // Assumes a unique constraint on (user_id, provider)
        },
      )
      .select()
      .single() // Assuming upsert returns the affected row

    if (error) {
      console.error('Error saving API key:', error)
      return NextResponse.json(
        { error: 'Failed to save API key', details: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: 'API key saved successfully', data },
      { status: 200 },
    )
  } catch (e: any) {
    console.error('Unexpected error in POST /api/user/api-keys:', e)
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: e.message },
      { status: 500 },
    )
  }
}

// Later, you might add a GET handler to retrieve providers for which a user has a key (without exposing the key itself)
// export async function GET(request: Request) { ... }
