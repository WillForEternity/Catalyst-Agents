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

    // For now, we'll use a simple obfuscation technique
    // In production, you should use proper encryption or Supabase Vault
    // This is just to avoid storing plaintext keys
    const obfuscateKey = (key: string): string => {
      // Simple base64 encoding with a prefix to identify it's obfuscated
      return 'OBFUSCATED:' + Buffer.from(key).toString('base64')
    }

    // Obfuscate the API key
    const obfuscatedKey = obfuscateKey(apiKey)

    // Store the encrypted key and IV

    const { data, error } = await supabase
      .from('api_keys')
      .upsert(
        {
          user_id: user.id,
          provider: provider,
          api_key: obfuscatedKey, // Storing the obfuscated key
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

// GET handler to retrieve providers for which a user has a key (without exposing the key itself)
export async function GET(request: Request) {
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

    // Fetch the user's saved API keys (only provider names, not the keys themselves)
    const { data, error } = await supabase
      .from('api_keys')
      .select('provider')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching API keys:', error)
      return NextResponse.json(
        { error: 'Failed to fetch API keys', details: error.message },
        { status: 500 },
      )
    }

    // Return just the provider names, not the keys
    return NextResponse.json(
      { data: data.map((key) => ({ provider: key.provider, hasKey: true })) },
      { status: 200 },
    )
  } catch (e: any) {
    console.error('Unexpected error in GET /api/user/api-keys:', e)
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: e.message },
      { status: 500 },
    )
  }
}
