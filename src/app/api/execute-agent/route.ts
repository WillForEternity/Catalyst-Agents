import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

// Retrieve the API key for a user and provider
async function getApiKey(userId: string, provider: string, supabase: any) {
  const { data, error } = await supabase
    .from('api_keys')
    .select('api_key')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single()

  if (error || !data) {
    console.error(`API key not found for provider ${provider}`, error)
    return null
  }
  return data.api_key
}

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()
  if (sessionError || !session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  const userId = session.user.id

  const { provider, model, systemPrompt, messages } = await request.json()
  if (!provider || !model || !Array.isArray(messages)) {
    return NextResponse.json(
      { error: 'Missing required: provider, model, messages' },
      { status: 400 },
    )
  }
  if (provider !== 'openai') {
    return NextResponse.json(
      { error: `Unsupported provider: ${provider}` },
      { status: 400 },
    )
  }

  const apiKey = await getApiKey(userId, provider, supabase)
  if (!apiKey) {
    return NextResponse.json(
      { error: `API key not found for ${provider}` },
      { status: 400 },
    )
  }

  // Build message array for OpenAI
  const chatMessages: { role: string; content: string }[] = []
  if (systemPrompt) {
    chatMessages.push({ role: 'system', content: systemPrompt })
  }
  chatMessages.push(...messages)

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages: chatMessages, stream: true }),
    })

    if (!res.ok) {
      const err = await res.json()
      console.error('OpenAI API error', err)
      return NextResponse.json(
        { error: err.error?.message || 'OpenAI request failed' },
        { status: res.status },
      )
    }

    // Stream the raw response body back to client
    return new NextResponse(res.body, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    })
  } catch (e: any) {
    console.error('Error streaming OpenAI response', e)
    return NextResponse.json(
      { error: 'Stream error', details: e.message },
      { status: 500 },
    )
  }
}
