import { anthropic } from '@ai-sdk/anthropic'
import { generateText, stepCountIs } from 'ai'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { buildChatTools, CHAT_SYSTEM_PROMPT } from '@/lib/chat-server'

const requestSchema = z.object({
  content: z.string().trim().min(1).max(4000),
})

const HISTORY_CONTEXT_LIMIT = 20

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return NextResponse.json({ error: 'Nicht eingeloggt.' }, { status: 401 })
  }
  const userId = userData.user.id

  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }
  const { content } = parsed.data

  const { data: history } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(HISTORY_CONTEXT_LIMIT)

  const { data: userMessage, error: insertError } = await supabase
    .from('chat_messages')
    .insert({ user_id: userId, role: 'user', content })
    .select()
    .single()
  if (insertError || !userMessage) {
    return NextResponse.json({ error: 'Nachricht konnte nicht gespeichert werden.' }, { status: 500 })
  }

  const tools = buildChatTools(supabase, userId, userMessage.id)

  try {
    const { text } = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      system: CHAT_SYSTEM_PROMPT,
      messages: [...(history ?? []).reverse(), { role: 'user' as const, content }],
      tools,
      stopWhen: stepCountIs(5),
    })

    const { data: assistantMessage, error: assistantError } = await supabase
      .from('chat_messages')
      .insert({ user_id: userId, role: 'assistant', content: text.trim() })
      .select()
      .single()
    if (assistantError || !assistantMessage) {
      return NextResponse.json({ error: 'Antwort konnte nicht gespeichert werden.' }, { status: 500 })
    }

    const { data: pendingActions } = await supabase
      .from('pending_actions')
      .select('id, chat_message_id, action_type, summary, status, created_at')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)

    return NextResponse.json({ message: assistantMessage, pendingAction: pendingActions?.[0] ?? null })
  } catch (err) {
    console.error('DEBUG chat AI error:', err)
    return NextResponse.json({ error: 'Antwort konnte nicht generiert werden.' }, { status: 502 })
  }
}
