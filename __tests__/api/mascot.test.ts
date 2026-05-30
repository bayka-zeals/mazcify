jest.mock('@/lib/pixverse', () => ({
  generateImages: jest.fn(),
  generateCharacterSheet: jest.fn(),
  PixVerseError: class extends Error {
    constructor(msg: string) {
      super(msg)
      this.name = 'PixVerseError'
    }
  },
}))

import { NextRequest } from 'next/server'
import { POST, PATCH } from '@/app/api/mascot/route'
import { generateImages, generateCharacterSheet } from '@/lib/pixverse'

const mockGenerateImages = generateImages as jest.Mock
const mockGenerateCharacterSheet = generateCharacterSheet as jest.Mock

function makeRequest(method: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/mascot', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('POST /api/mascot', () => {
  it('returns 400 for missing imagePrompt', async () => {
    const res = await POST(
      makeRequest('POST', {
        userId: 'u1',
        brandId: 'b1',
        mascotId: 'm1',
      })
    )
    expect(res.status).toBe(400)
  })

  it('returns 200 with exactly 3 variations on happy path', async () => {
    mockGenerateImages.mockResolvedValueOnce([
      { id: '1', imageUrl: 'https://img1.png', prompt: 'test' },
      { id: '2', imageUrl: 'https://img2.png', prompt: 'test' },
      { id: '3', imageUrl: 'https://img3.png', prompt: 'test' },
    ])

    const res = await POST(
      makeRequest('POST', {
        userId: 'u1',
        brandId: 'b1',
        mascotId: 'm1',
        imagePrompt: 'A cool mascot',
      })
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.variations).toHaveLength(3)
    expect(body.variations[0].imageUrl).toBe('https://img1.png')
  })
})

describe('PATCH /api/mascot', () => {
  it('returns 400 for missing chosenVariationId', async () => {
    const res = await PATCH(
      makeRequest('PATCH', {
        userId: 'u1',
        brandId: 'b1',
        mascotId: 'm1',
        chosenImageUrl: 'https://img.png',
        gender: 'male',
      })
    )
    expect(res.status).toBe(400)
  })

  it('returns 200 with characterSheetUrl on happy path', async () => {
    mockGenerateCharacterSheet.mockResolvedValueOnce({
      imageId: 999,
      url: 'https://img.pixverse.ai/sheet.png',
    })

    const res = await PATCH(
      makeRequest('PATCH', {
        userId: 'u1',
        brandId: 'b1',
        mascotId: 'm1',
        chosenVariationId: 'v1',
        chosenImageUrl: 'https://img.pixverse.ai/chosen.png',
        gender: 'female',
        mascotName: 'Foxy',
      })
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.characterSheetUrl).toBe('https://img.pixverse.ai/sheet.png')
    expect(body.characterSheetImageId).toBe('999')
  })

  it('returns 500 when character sheet generation exhausts all fallback models', async () => {
    mockGenerateCharacterSheet.mockRejectedValueOnce(new Error('All character sheet models failed'))

    const res = await PATCH(
      makeRequest('PATCH', {
        userId: 'u1',
        brandId: 'b1',
        mascotId: 'm1',
        chosenVariationId: 'v1',
        chosenImageUrl: 'https://img.pixverse.ai/chosen.png',
        gender: 'male',
      })
    )

    expect(res.status).toBe(500)
  })
})
