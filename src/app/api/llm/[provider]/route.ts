import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'

// Define the request body type
interface LlmRequestBody {
  prompt: string
  model?: string
  options?: Record<string, any>
}

export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } },
) {
  try {
    // Get the provider from the URL
    const provider = params.provider

    // Parse the request body
    const body: LlmRequestBody = await request.json()
    const { prompt, model, options = {} } = body

    // Validate the request
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Get the current user from Supabase Auth
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 },
      )
    }

    const userId = session.user.id

    // Fetch the API key for the specified provider
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single()

    if (apiKeyError || !apiKeyData) {
      return NextResponse.json(
        {
          error: `API key not found for provider: ${provider}. Please add your API key in Settings.`,
        },
        { status: 404 },
      )
    }

    const apiKey = apiKeyData.api_key

    // Call the appropriate LLM based on the provider
    let result

    switch (provider) {
      case 'openai':
        result = await callOpenAI(apiKey, prompt, model, options)
        break
      case 'anthropic':
        result = await callAnthropic(apiKey, prompt, model, options)
        break
      default:
        return NextResponse.json(
          { error: `Unsupported provider: ${provider}` },
          { status: 400 },
        )
    }

    return NextResponse.json({ text: result })
  } catch (error: any) {
    console.error('LLM API error:', error)
    return NextResponse.json(
      {
        error:
          error.message || 'An error occurred while processing your request',
      },
      { status: 500 },
    )
  }
}

// Function to call OpenAI
async function callOpenAI(
  apiKey: string,
  prompt: string,
  model = 'gpt-4',
  options: Record<string, any> = {},
) {
  const llm = new OpenAI({
    openAIApiKey: apiKey,
    modelName: model,
    temperature: options.temperature ?? 0.7,
    maxTokens: options.maxTokens,
  })

  const result = await llm.invoke(prompt)
  return result
}

// Function to call Anthropic
async function callAnthropic(
  apiKey: string,
  prompt: string,
  model = 'claude-3-opus-20240229',
  options: Record<string, any> = {},
) {
  const llm = new ChatAnthropic({
    anthropicApiKey: apiKey,
    modelName: model,
    temperature: options.temperature ?? 0.7,
    maxTokens: options.maxTokens,
  })

  const result = await llm.invoke(prompt)
  return result
}
