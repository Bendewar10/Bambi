import { describe, it, expect, vi, beforeEach } from 'vitest'

const { generateTextMock } = vi.hoisted(() => ({ generateTextMock: vi.fn() }))
vi.mock('ai', async () => {
  const actual = await vi.importActual<typeof import('ai')>('ai')
  return { ...actual, generateText: generateTextMock }
})

const { getUserMock, historyLimitMock, insertMock, pendingLimitMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  historyLimitMock: vi.fn(),
  insertMock: vi.fn(),
  pendingLimitMock: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: async () => ({
    auth: { getUser: getUserMock },
    from: (table: string) => {
      if (table === 'chat_messages') {
        return {
          select: () => ({ eq: () => ({ order: () => ({ limit: historyLimitMock }) }) }),
          insert: (row: { role: string; content: string }) => ({
            select: () => ({ single: () => insertMock(row) }),
          }),
        }
      }
      return {
        select: () => ({ eq: () => ({ eq: () => ({ order: () => ({ limit: pendingLimitMock }) }) }) }),
      }
    },
  }),
}))

import { POST } from './route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/chat', { method: 'POST', body: JSON.stringify(body) })
}

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    historyLimitMock.mockResolvedValue({ data: [] })
    pendingLimitMock.mockResolvedValue({ data: [] })
    insertMock.mockImplementation((row) =>
      Promise.resolve({ data: { id: `id-${row.role}`, ...row, created_at: 'now' }, error: null })
    )
  })

  it('returns 401 when not authenticated', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })
    const res = await POST(makeRequest({ content: 'Hallo' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for empty content', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u1' } } })
    const res = await POST(makeRequest({ content: '' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for content over 4000 characters', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u1' } } })
    const res = await POST(makeRequest({ content: 'x'.repeat(4001) }))
    expect(res.status).toBe(400)
  })

  it('saves the user message, calls the AI, and returns the assistant reply with no pending action', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u1' } } })
    generateTextMock.mockResolvedValue({ text: 'Du hast aktuell 0 Kontakte.' })

    const res = await POST(makeRequest({ content: 'Wie viele Kontakte habe ich?' }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ role: 'user', content: 'Wie viele Kontakte habe ich?' }))
    expect(json.message.content).toBe('Du hast aktuell 0 Kontakte.')
    expect(json.pendingAction).toBeNull()
  })

  it('returns the open pending action created during this turn', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u1' } } })
    generateTextMock.mockResolvedValue({ text: 'Ich warte auf deine Bestätigung.' })
    pendingLimitMock.mockResolvedValue({
      data: [{ id: 'p1', chat_message_id: 'id-user', action_type: 'delete_contact', summary: 'Löschen?', status: 'pending', created_at: 'now' }],
    })

    const res = await POST(makeRequest({ content: 'Lösch Tom.' }))
    const json = await res.json()

    expect(json.pendingAction.id).toBe('p1')
  })

  it('returns 502 when the AI call fails', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u1' } } })
    generateTextMock.mockRejectedValue(new Error('provider down'))

    const res = await POST(makeRequest({ content: 'Hallo' }))
    expect(res.status).toBe(502)
  })
})
