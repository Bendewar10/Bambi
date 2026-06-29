import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getUserMock, messagesLimitMock, pendingLimitMock, deleteMessagesMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  messagesLimitMock: vi.fn(),
  pendingLimitMock: vi.fn(),
  deleteMessagesMock: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: async () => ({
    auth: { getUser: getUserMock },
    from: (table: string) => {
      if (table === 'chat_messages') {
        return {
          select: () => ({ eq: () => ({ order: () => ({ limit: messagesLimitMock }) }) }),
          delete: () => ({ eq: deleteMessagesMock }),
        }
      }
      return {
        select: () => ({ eq: () => ({ eq: () => ({ order: () => ({ limit: pendingLimitMock }) }) }) }),
      }
    },
  }),
}))

import { GET, DELETE } from './route'

describe('GET /api/chat/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    messagesLimitMock.mockResolvedValue({ data: [] })
    pendingLimitMock.mockResolvedValue({ data: [] })
  })

  it('returns 401 when not authenticated', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns messages in chronological order and null pendingAction when none open', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u1' } } })
    messagesLimitMock.mockResolvedValue({
      data: [
        { id: 'm2', role: 'assistant', content: 'zweite', created_at: '2026-06-29T10:01:00Z' },
        { id: 'm1', role: 'user', content: 'erste', created_at: '2026-06-29T10:00:00Z' },
      ],
    })

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.messages.map((m: { id: string }) => m.id)).toEqual(['m1', 'm2'])
    expect(json.pendingAction).toBeNull()
  })

  it('returns the open pending action when one exists', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u1' } } })
    pendingLimitMock.mockResolvedValue({
      data: [{ id: 'p1', chat_message_id: 'm1', action_type: 'delete_contact', summary: 'Löschen?', status: 'pending', created_at: 'now' }],
    })

    const res = await GET()
    const json = await res.json()

    expect(json.pendingAction.id).toBe('p1')
  })
})

describe('DELETE /api/chat/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deleteMessagesMock.mockResolvedValue({ error: null })
  })

  it('returns 401 when not authenticated', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })
    const res = await DELETE()
    expect(res.status).toBe(401)
  })

  it('deletes all chat messages for the authenticated user', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u1' } } })
    const res = await DELETE()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(deleteMessagesMock).toHaveBeenCalledWith('user_id', 'u1')
  })

  it('returns 500 when the delete fails', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u1' } } })
    deleteMessagesMock.mockResolvedValue({ error: { message: 'db error' } })
    const res = await DELETE()
    expect(res.status).toBe(500)
  })
})
