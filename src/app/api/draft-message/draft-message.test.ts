import { describe, it, expect, vi, beforeEach } from 'vitest'

const { generateTextMock } = vi.hoisted(() => ({ generateTextMock: vi.fn() }))
vi.mock('ai', () => ({ generateText: generateTextMock }))

const { getUserMock, contactSingleMock, interactionsBuilderMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  contactSingleMock: vi.fn(),
  interactionsBuilderMock: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: async () => ({
    auth: { getUser: getUserMock },
    from: (table: string) => {
      if (table === 'contacts') {
        return {
          select: () => ({
            eq: () => ({
              single: contactSingleMock,
            }),
          }),
        }
      }
      return {
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: interactionsBuilderMock,
            }),
          }),
        }),
      }
    },
  }),
}))

import { POST } from './route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/draft-message', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('POST /api/draft-message', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    interactionsBuilderMock.mockResolvedValue({ data: [] })
  })

  it('returns 401 when not authenticated', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })
    const res = await POST(makeRequest({ contactId: '550e8400-e29b-41d4-a716-446655440000', occasionType: 'followup' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid input', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u1' } } })
    const res = await POST(makeRequest({ contactId: 'not-a-uuid', occasionType: 'followup' }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when contact is not found (or not owned)', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u1' } } })
    contactSingleMock.mockResolvedValue({ data: null })
    const res = await POST(makeRequest({ contactId: '550e8400-e29b-41d4-a716-446655440000', occasionType: 'followup' }))
    expect(res.status).toBe(404)
  })

  it('returns generated text for a valid follow-up request', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u1' } } })
    contactSingleMock.mockResolvedValue({ data: { name: 'Anna', notes: null, context: 'Sport' } })
    generateTextMock.mockResolvedValue({ text: 'Hey Anna, lange nichts gehört!' })

    const res = await POST(makeRequest({ contactId: '550e8400-e29b-41d4-a716-446655440000', occasionType: 'followup' }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.text).toBe('Hey Anna, lange nichts gehört!')
  })

  it('returns 502 when the AI provider call fails', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u1' } } })
    contactSingleMock.mockResolvedValue({ data: { name: 'Anna', notes: null, context: null } })
    generateTextMock.mockRejectedValue(new Error('provider down'))

    const res = await POST(makeRequest({ contactId: '550e8400-e29b-41d4-a716-446655440000', occasionType: 'birthday' }))
    expect(res.status).toBe(502)
  })
})
