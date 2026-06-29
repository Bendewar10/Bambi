import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { CHAT_HISTORY_LIMIT } from '@/lib/chat'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return NextResponse.json({ error: 'Nicht eingeloggt.' }, { status: 401 })
  }
  const userId = userData.user.id

  const [{ data: messages }, { data: pendingActions }] = await Promise.all([
    supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(CHAT_HISTORY_LIMIT),
    supabase
      .from('pending_actions')
      .select('id, chat_message_id, action_type, summary, status, created_at')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  return NextResponse.json({
    messages: (messages ?? []).reverse(),
    pendingAction: pendingActions?.[0] ?? null,
  })
}
